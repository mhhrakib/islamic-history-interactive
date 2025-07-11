import json
import firebase_admin
from firebase_admin import credentials, firestore

def migrate_data(language_code):
    """
    Migrates data for a specific language from a local JSON file to Firestore.

    Args:
        language_code (str): The language code ('en' or 'bn').
    """
    try:
        # --- 1. Initialize Firebase Admin SDK ---
        # The SDK will automatically find the GOOGLE_APPLICATION_CREDENTIALS environment variable
        # if you set it, or you can pass the path directly as shown below.
        if not firebase_admin._apps:
            # Initialize the app only if it hasn't been initialized yet
            cred = credentials.Certificate("serviceAccountKey.json")
            firebase_admin.initialize_app(cred)
        
        db = firestore.client()
        print(f"✅ Firebase Admin SDK initialized for '{language_code}' migration.")

        # --- 2. Load Local JSON Data with Enhanced Error Handling ---
        file_suffix = '_bn' if language_code == 'bn' else ''
        file_path = f'./public/data/rawHistoricalData{file_suffix}.json'
        
        raw_text = ""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                raw_text = f.read()
                if not raw_text.strip():
                    raise ValueError("File is empty or contains only whitespace.")
                raw_data = json.loads(raw_text)
            print(f"📄 Loaded and parsed {len(raw_data)} eras from {file_path}")
        except json.JSONDecodeError as e:
            print(f"❌ ERROR: Failed to decode JSON from {file_path}.")
            print(f"JSON Error: {e}")
            print("--- Start of File Content (first 500 chars) ---")
            print(raw_text[:500] + "..." if len(raw_text) > 500 else raw_text)
            print("--- End of File Content ---")
            raise  # Stop the script
        except ValueError as e:
            print(f"❌ ERROR: {e} in file {file_path}.")
            raise # Stop the script


        # --- 3. Prepare and Execute Batch Write ---
        batch = db.batch()
        total_docs = 0
        
        # Define collection names
        eras_collection_name = f'eras_{language_code}'
        topics_collection_name = f'topics_{language_code}'
        events_collection_name = f'events_{language_code}'
        
        print(f"🔥 Starting migration for collections: {eras_collection_name}, {topics_collection_name}, {events_collection_name}")

        # Loop through Eras
        for era_order, era_data in enumerate(raw_data, 1):
            era_ref = db.collection(eras_collection_name).document()
            
            # Prepare era document, excluding topics
            era_doc = {
                'title': era_data['title'],
                'description': era_data['description'],
                'order': era_order
            }
            batch.set(era_ref, era_doc)
            total_docs += 1

            # Loop through Topics within the Era
            for topic_order, topic_data in enumerate(era_data['topics'], 1):
                topic_ref = db.collection(topics_collection_name).document()
                
                # Safely copy the topic data to avoid modifying the original dict
                topic_doc_data = topic_data.copy()
                events_in_topic = topic_doc_data.pop('events', [])

                topic_doc = {
                    **topic_doc_data,
                    'eraId': era_ref.id,  # Link back to the parent era
                    'order': topic_order
                }
                batch.set(topic_ref, topic_doc)
                total_docs += 1

                # Loop through Events within the Topic
                for event_order, event_data in enumerate(events_in_topic, 1):
                    event_ref = db.collection(events_collection_name).document()
                    
                    event_doc = {
                        **event_data,
                        'topicId': topic_ref.id, # Link back to the parent topic
                        'order': event_order
                    }
                    batch.set(event_ref, event_doc)
                    total_docs += 1
        
        # --- 4. Commit the Batch ---
        print(f"⏳ Preparing to commit {total_docs} documents in a single batch...")
        batch.commit()
        print(f"🚀 Migration for '{language_code}' successful! Wrote {total_docs} documents to Firestore.")

    except FileNotFoundError:
        print(f"❌ ERROR: Could not find the service account key. Ensure 'serviceAccountKey.json' is in the project root.")
    except Exception as e:
        print(f"❌ An unexpected error occurred during migration for '{language_code}': {e}")


if __name__ == '__main__':
    print("--- Starting Firestore Data Migration ---")
    try:
        migrate_data('en')  # Migrate English data
        print("\n----------------------------------------\n")
        migrate_data('bn')  # Migrate Bengali data
        print("\n--- All migrations complete. ---")
    except Exception:
        print("\n--- Migration halted due to an error. ---")

