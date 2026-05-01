import pandas as pd
import numpy as np
import warnings
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.neighbors import NearestNeighbors
from surprise import SVD, Dataset, Reader
from .models import Dorm, Student, Rating

warnings.filterwarnings('ignore')

class DormRecommenderX222:
    def __init__(self):
        self.dorms_df = None
        self.students_df = None
        self.ratings_df = None
        self.svd_model = None
        self.scaler = StandardScaler()
        self.le_room = LabelEncoder()
        self.le_gender = LabelEncoder()
        
    def load_data(self):
        # Fetch from Django Models
        dorms = Dorm.objects.filter(approval_status='approved', is_available=True, is_reported=False)
        students = Student.objects.all()
        ratings = Rating.objects.all()
        
        if not dorms.exists():
            self.dorms_df = pd.DataFrame()
        else:
            self.dorms_df = pd.DataFrame(list(dorms.values(
                'dorm_id', 'price_egp', 'distance_km', 'room_type', 'gender_policy',
                'has_wifi', 'has_kitchen', 'has_laundry', 'has_ac', 'has_gym', 'is_pet_friendly',
                'capacity', 'current_occupants'
            )))
            # Final availability check
            self.dorms_df = self.dorms_df[self.dorms_df['current_occupants'] < self.dorms_df['capacity']]

        if not students.exists():
            self.students_df = pd.DataFrame()
        else:
            self.students_df = pd.DataFrame(list(students.values(
                'student_id', 'budget_min_egp', 'budget_max_egp', 'preferred_distance_km', 'preferred_room_type',
                'gender', 'needs_wifi', 'needs_kitchen', 'needs_laundry', 'needs_ac', 'needs_gym', 'needs_pet_friendly'
            )))

        if not ratings.exists():
            self.ratings_df = pd.DataFrame(columns=['student_id', 'dorm_id', 'final_rating'])
        else:
            self.ratings_df = pd.DataFrame(list(ratings.values('student_id', 'dorm_id', 'final_rating')))

    def train_models(self):
        if self.dorms_df.empty or self.students_df.empty:
            return
            
        # Encoding
        all_room_types = pd.concat([self.dorms_df['room_type'], self.students_df['preferred_room_type']]).astype(str)
        self.le_room.fit(all_room_types)
        self.dorms_df['room_type_enc'] = self.le_room.transform(self.dorms_df['room_type'].astype(str))
        self.students_df['room_type_enc'] = self.le_room.transform(self.students_df['preferred_room_type'].astype(str))
        
        all_genders = pd.concat([self.dorms_df['gender_policy'], self.students_df['gender']]).astype(str)
        self.le_gender.fit(all_genders)
        self.dorms_df['gender_policy_enc'] = self.le_gender.transform(self.dorms_df['gender_policy'].astype(str))
        self.students_df['gender_enc'] = self.le_gender.transform(self.students_df['gender'].astype(str))
        
        # Scaling
        self.dorms_df[['price_scaled', 'distance_scaled']] = self.scaler.fit_transform(
            self.dorms_df[['price_egp', 'distance_km']]
        )
        
        student_features = self.students_df[['budget_max_egp', 'preferred_distance_km']].copy()
        student_features.columns = ['price_egp', 'distance_km']
        self.students_df[['budget_scaled', 'distance_scaled']] = self.scaler.transform(student_features)
        
        # SVD
        if len(self.ratings_df) >= 5:
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
            
        filtered = self.dorms_df[
            (self.dorms_df["price_egp"] <= student["budget_max_egp"]) &
            (self.dorms_df["distance_km"] <= student["preferred_distance_km"]) &
            ((self.dorms_df["gender_policy"] == "mixed") | (self.dorms_df["gender_policy"] == student["gender"]))
        ]
        
        if len(filtered) == 0:
            return {}
            
        features = filtered[[
            "price_scaled", "distance_scaled", "room_type_enc",
            "has_wifi", "has_kitchen", "has_laundry",
            "has_ac", "gender_policy_enc", "has_gym"
        ]].astype(float)
        
        student_vector = np.array([[
            student["budget_scaled"],
            student["distance_scaled"],
            student["room_type_enc"],
            int(student["needs_wifi"]),
            int(student["needs_kitchen"]),
            int(student["needs_laundry"]),
            int(student["needs_ac"]),
            int(student["gender_enc"]),
            int(student["needs_gym"])
        ]], dtype=float)
        
        knn = NearestNeighbors(n_neighbors=len(filtered), metric="euclidean")
        knn.fit(features.values)
        
        distances, indices = knn.kneighbors(student_vector)
        
        scores = {}
        for i, idx in enumerate(indices[0]):
            dorm_id = filtered.iloc[idx]["dorm_id"]
            scores[dorm_id] = np.exp(-distances[0][i] * 2)
            
        return scores

    def get_cf_recommendations(self, student_id, filtered_dorm_ids):
        if not self.svd_model:
            return {}
            
        scores = {}
        for dorm_id in filtered_dorm_ids:
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
        if n == 0: return 1.0, 0.0
        elif n < 5: return 0.7, 0.3
        elif n < 10: return 0.5, 0.5
        else: return 0.2, 0.8

    def recommend_hybrid(self, student_id, k=5):
        self.load_data()
        self.train_models()
        
        if self.dorms_df.empty:
            return []
            
        cbf_scores = self.get_cbf_recommendations(student_id)
        cf_scores = self.get_cf_recommendations(student_id, list(cbf_scores.keys()))
        
        seen = set(self.ratings_df[self.ratings_df["student_id"] == student_id]["dorm_id"]) if not self.ratings_df.empty else set()
        all_dorms = (set(cbf_scores.keys()) | set(cf_scores.keys())) - seen
        
        if not all_dorms:
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
            
            # Applying the new formula from dormlinkx222
            final_scores[dorm] = (w_cbf * s_cbf) + (w_cf * (s_cf ** 1.1)) + (0.2 * np.log(1 + pop))
            
        ranked = sorted(final_scores.items(), key=lambda x: x[1], reverse=True)
        return [d[0] for d in ranked[:k]]

recommender_instance = DormRecommenderX222()
