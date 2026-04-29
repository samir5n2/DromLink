# DormLink AI Data Mapping Guide 🤖🗺️

This document serves as the semantic map for the DormLink database, designed to help AI models (LLMs) understand the project structure, relationships, and data meaning.

## 🏗️ Core Architecture Overview
DormLink is a student housing platform connecting **Students** with **Landlords** for dorm/apartment rentals.

---

## 📊 Entity Relationship Mapping

### 1. Users & Profiles (`User`, `Student`, `Landlord`)
- **Relationship:** Every `User` can have one `Student` profile OR one `Landlord` profile.
- **AI Context:** Use `User.user_type` ('student', 'landlord', 'admin') to identify the role.
- **Key Fields:**
  - `account_status`: Critical. Only 'approved' users can perform key actions.

### 2. Properties & Listings (`Dorm`, `DormImage`)
- **Relationship:** A `Landlord` owns multiple `Dorms`. A `Dorm` has multiple `DormImages`.
- **AI Context:** This is the primary dataset for search/recommendation.
- **Key Fields:**
  - `category`: ('room', 'apartment', 'studio').
  - `gender_type`: ('male', 'female', 'mixed'). Important for student matching.
  - `amenities`: JSON/String list of features (Wifi, AC, etc.).

### 3. Bookings (`BookingRequest`)
- **Relationship:** Connects a `Student` to a `Dorm`.
- **AI Context:** Tracks occupancy and demand.
- **Status Flow:** `pending` -> `approved` or `rejected`. 
- **Business Logic:** A booking is only finalized when `status='approved'`.

### 4. Communication (`Message`, `ContactMessage`)
- **Relationship:** `Message` handles chat between any two users. `ContactMessage` is for external guest inquiries.
- **AI Context:** Used for sentiment analysis and automated support.
- **Flag:** `is_chat_closed=True` means the conversation is archived.

---

## 🛠️ AI Querying Cheat Sheet

| User Query | Target Table | Logic/Filter |
|------------|--------------|--------------|
| "Find cheap rooms" | `Dorm` | Filter by `price < X` and `category='room'` |
| "Show me my bookings" | `BookingRequest` | Filter by `student_id` |
| "Is this landlord trusted?" | `Review` | Aggregate `rating` for `landlord_id` |
| "Contact support" | `ContactMessage` | Create new entry in `ContactMessage` |

---

## 🔐 Data Security & Privacy Rules
1. **Never** expose `password` hashes or `token` data to AI.
2. **Mask** private emails/phones until a booking is `approved`.
3. AI should only query data owned by the authenticated user (Multitenancy).

---

## 📈 Suggested AI Features
- **Smart Matching:** Match students with dorms based on `gender_type` and `amenities`.
- **Automated Support:** Resolve `ContactMessage` inquiries using this map as context.
- **Price Analytics:** Predict rental trends based on `Dorm.price` history.

---
*Created by Antigravity AI for DormLink Project.*
