import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.neighbors import NearestNeighbors
from surprise import SVD, Dataset, Reader
from .models import Dorm, Student, Rating

class DormRecommender:
    def __init__(self):
        self.dorms_df = None
        self.students_df = None
        self.ratings_df = None
        self.svd_model = None
        self.knn_model = None
        
    def load_data(self):
        dorms = Dorm.objects.filter(approval_status='approved')
        students = Student.objects.all()
        ratings = Rating.objects.all()
        
        self.dorms_df = pd.DataFrame(list(dorms.values(
            'dorm_id', 'price_egp', 'distance_km', 'room_type', 'gender_preference', 'gender_policy',
            'has_wifi', 'has_kitchen', 'has_laundry', 'has_ac', 'has_gym', 'is_pet_friendly',
            'capacity', 'current_occupants', 'is_available'
        )))
        
        # Filter available dorms
        if not self.dorms_df.empty:
            self.dorms_df = self.dorms_df[
                (self.dorms_df['current_occupants'] < self.dorms_df['capacity']) & 
                (self.dorms_df['is_available'] == True)
            ]
        
        self.students_df = pd.DataFrame(list(students.values(
            'student_id', 'budget_min_egp', 'budget_max_egp', 'preferred_distance_km', 'preferred_room_type',
            'gender', 'needs_wifi', 'needs_kitchen', 'needs_laundry', 'needs_ac', 'needs_gym', 'needs_pet_friendly'
        )))
        
        self.ratings_df = pd.DataFrame(list(ratings.values('student_id', 'dorm_id', 'final_rating')))
        
    def train_models(self):
        if self.dorms_df.empty or self.students_df.empty:
            return
            
        # --- Preprocessing for CBF (KNN) ---
        self.le_room = LabelEncoder()
        all_room_types = pd.concat([self.dorms_df['room_type'], self.students_df['preferred_room_type']]).astype(str)
        self.le_room.fit(all_room_types)
        
        self.dorms_df['room_type_enc'] = self.le_room.transform(self.dorms_df['room_type'].astype(str))
        self.students_df['room_type_enc'] = self.le_room.transform(self.students_df['preferred_room_type'].astype(str))
        
        self.le_gender = LabelEncoder()
        all_genders = pd.concat([self.dorms_df['gender_policy'], self.students_df['gender']]).astype(str)
        self.le_gender.fit(all_genders)
        
        self.dorms_df['gender_policy_enc'] = self.le_gender.transform(self.dorms_df['gender_policy'].astype(str))
        self.students_df['gender_enc'] = self.le_gender.transform(self.students_df['gender'].astype(str))
        
        self.scaler = StandardScaler()
        if len(self.dorms_df) > 0:
            self.dorms_df[['price_scaled', 'distance_scaled']] = self.scaler.fit_transform(
                self.dorms_df[['price_egp', 'distance_km']]
            )
            
            # Use distance and price scale for student budget and preferred distance
            student_features = self.students_df[['budget_max_egp', 'preferred_distance_km']].copy()
            student_features.columns = ['price_egp', 'distance_km'] # rename to match fit
            self.students_df[['budget_scaled', 'distance_scaled']] = self.scaler.transform(student_features)
            
        # --- Train SVD (Collaborative Filtering) ---
        if not self.ratings_df.empty and len(self.ratings_df) > 5:
            reader = Reader(rating_scale=(1, 5))
            data = Dataset.load_from_df(self.ratings_df[['student_id', 'dorm_id', 'final_rating']], reader)
            trainset = data.build_full_trainset()
            self.svd_model = SVD(n_factors=100, n_epochs=30, lr_all=0.005, reg_all=0.02, random_state=42)
            self.svd_model.fit(trainset)
            
    def get_cbf_recommendations(self, student_id):
        try:
            student = self.students_df[self.students_df["student_id"] == student_id].iloc[0]
        except IndexError:
            return {}
            
        # Filter dorms based on basic constraints
        filtered = self.dorms_df[
            (self.dorms_df["price_egp"] >= student["budget_min_egp"]) &
            (self.dorms_df["price_egp"] <= student["budget_max_egp"]) &
            (self.dorms_df["distance_km"] <= student["preferred_distance_km"]) &
            ((self.dorms_df["gender_policy"] == student["gender"]) | (self.dorms_df["gender_policy"] == "mixed"))
        ]
        
        if len(filtered) == 0:
            return {}
            
        features = filtered[[
            "price_scaled", "distance_scaled", "room_type_enc",
            "has_wifi", "has_kitchen", "has_laundry",
            "has_ac", "has_gym", "is_pet_friendly"
        ]].astype(float)
        
        student_vector = np.array([[
            student["budget_scaled"],
            student["distance_scaled"],
            student["room_type_enc"],
            int(student["needs_wifi"]),
            int(student["needs_kitchen"]),
            int(student["needs_laundry"]),
            int(student["needs_ac"]),
            int(student["needs_gym"]),
            int(student["needs_pet_friendly"])
        ]], dtype=float)
        
        knn = NearestNeighbors(n_neighbors=len(filtered))
        knn.fit(features.values)
        
        distances, indices = knn.kneighbors(student_vector)
        
        scores = {}
        for i, idx in enumerate(indices[0]):
            dorm_id = filtered.iloc[idx]["dorm_id"]
            scores[dorm_id] = np.exp(-distances[0][i] * 2)
            
        return scores
        
    def get_cf_recommendations(self, student_id, filtered_dorms):
        if not self.svd_model:
            return {}
            
        scores = {}
        for dorm_id in filtered_dorms["dorm_id"]:
            pred = self.svd_model.predict(str(student_id), str(dorm_id)).est
            scores[dorm_id] = pred
            
        return scores

    def normalize_scores(self, scores_dict):
        if not scores_dict:
            return {}
        vals = np.array(list(scores_dict.values()))
        min_v, max_v = vals.min(), vals.max()
        if max_v == min_v:
            return {k: 1 for k in scores_dict}
        return {k: (v - min_v) / (max_v - min_v) for k, v in scores_dict.items()}
        
    def get_dynamic_weights(self, student_id):
        if self.ratings_df.empty:
            return 1.0, 0.0
            
        n = len(self.ratings_df[self.ratings_df["student_id"] == student_id])
        if n == 0:
            return 1.0, 0.0   # cold start -> CBF
        elif n < 5:
            return 0.7, 0.3
        elif n < 10:
            return 0.5, 0.5
        else:
            return 0.2, 0.8   # heavy CF
            
    def recommend_hybrid(self, student_id, k=5):
        self.load_data()
        self.train_models()
        
        if self.dorms_df is None or self.dorms_df.empty:
            return []
            
        cbf_scores = self.get_cbf_recommendations(student_id)
        
        # Get filtered dorms to run CF on
        try:
            student = self.students_df[self.students_df["student_id"] == student_id].iloc[0]
            filtered = self.dorms_df[
                (self.dorms_df["price_egp"] >= student["budget_min_egp"]) &
                (self.dorms_df["price_egp"] <= student["budget_max_egp"]) &
                (self.dorms_df["distance_km"] <= student["preferred_distance_km"]) &
                ((self.dorms_df["gender_policy"] == student["gender"]) | (self.dorms_df["gender_policy"] == "mixed"))
            ]
        except IndexError:
            filtered = pd.DataFrame()
            
        cf_scores = self.get_cf_recommendations(student_id, filtered)
        
        seen = set(self.ratings_df[self.ratings_df["student_id"] == student_id]["dorm_id"]) if not self.ratings_df.empty else set()
        all_dorms = (set(cbf_scores.keys()) | set(cf_scores.keys())) - seen
        
        if not all_dorms:
            # Fallback if no matching dorms inside constraints: recommend based on gender only.
            try:
                student_gender = self.students_df[self.students_df["student_id"] == student_id].iloc[0]["gender"]
                fallback_dorms = self.dorms_df[self.dorms_df["gender_preference"] == student_gender]
                if fallback_dorms.empty:
                    return []
                top_ids = fallback_dorms.sort_values(by="price_egp")["dorm_id"].head(k).tolist()
                return top_ids
            except Exception:
                return []
            
        cbf_scores = self.normalize_scores(cbf_scores)
        cf_scores = self.normalize_scores(cf_scores)
        
        w_cbf, w_cf = self.get_dynamic_weights(student_id)
        
        final_scores = {}
        popularity = self.ratings_df.groupby("dorm_id").size().to_dict() if not self.ratings_df.empty else {}
        
        for dorm in all_dorms:
            s_cbf = cbf_scores.get(dorm, 0)
            s_cf  = cf_scores.get(dorm, 0)
            pop = popularity.get(dorm, 1)
            
            final_scores[dorm] = (w_cbf * s_cbf) + (w_cf * (s_cf ** 1.1)) + (0.2 * np.log(1 + pop))
            
        ranked = sorted(final_scores.items(), key=lambda x: x[1], reverse=True)
        top_ids = [d[0] for d in ranked[:k]]
        
        return top_ids

recommender_instance = DormRecommender()
