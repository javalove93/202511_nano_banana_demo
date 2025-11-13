gcloud firestore export gs://jerry-argolis-bucket-asia-northeast3/temp/firestore-backup \
  --database='(default)' \
  --collection-ids='nanobanana' \
  --project='jerry-argolis'

gcloud firestore import gs://jerry-argolis-bucket-asia-northeast3/temp/firestore-backup \
  --database='nanobanana-jerry' \
  --collection-ids='nanobanana' \
  --project='jerry-argolis'