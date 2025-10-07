import chokidar from 'chokidar'
import cloudinary from 'cloudinary'
import axios from 'axios'
import { readFile } from 'fs/promises'
import { unlink } from 'fs'

const api_url = "https://spp-api-v2.herokuapp.com"

const config = JSON.parse(
  await readFile(
    new URL('/home/pi/config.json', import.meta.url)
  )
);

const api = axios.create({
  baseURL: api_url,
  timeout: 1000,
  headers: {"Content-Type": "application/json"},
})

const cld = cloudinary.v2

cld.config({
  secure: true,
})

const upload_cloudinary = async path => {
  const options = {
    unique_filename: true,
    overwrite: true,
  } 

  const result = await cloudinary.uploader.upload(path, options)
  return result
}

const create_photo = async upload_data => api.post(`photos/${config.credentials.location.id}/${config.credentials.location.token}`, {
  width: upload_data.width, 
  height: upload_data.height,
  path: upload_data.url,
  isPublic: false
})


console.log("starting watcher")
chokidar.watch('/home/pi/images').on('add', async (event, path) => {
  console.log("uploading to cloudinary", event)
  let result
  try {
    result = await upload_cloudinary(event)
    console.log("uploaded to cloudinary successfully!", result)
  } catch (e) {
    console.error("failed to upload to cloudinary", e)
    return
  }
  
  try {
    console.log("creating photo on spp backend")
    result = await create_photo(result)
    console.log("created photo in spp backend", result)
  } catch (e) {
    console.error("failed to create photo in spp backend", e)
    return
  }
  unlink(event, e => {
    if (e) {
    console.error("failed to unlink file", e)
    return
    }
  })
  console.log("unlinked file" )
})


/*
 * export PATH="$PATH:/Users/spiraling/.local/bin"

export CLOUDINARY_URL="cloudinary://295776721798926:1Fg62Dl4ohkUhOlFLTHHknXMozA@spp-production"

locationId="150"
cloudinaryFolder="hot-folder-test"
cloudinaryEndpoint="https://spp-api-v2.herokuapp.com"

token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbiI6InNwcC1kYXNoYm9hcmQtYWxwaGEiLCJpYXQiOjE3NTM5MTM1NjksImV4cCI6MTc4NTQ3MTE2OX0.01WMxwUWV6UVMrz1c4FNyVb6H4kEOhI_ho6p99AZ7bM&="

output='s'
for file in "$@"; do
  result=$(cld uploader upload "$file" folder="$cloudinaryFolder" | jq '{ width: .width, height: .height, path: .url, isPublic: true}')
  wait
  output+=" $result"

  finished=$(curl --request POST \
    --url "$cloudinaryEndpoint/photos/$locationId?token=$token" \
    --header 'Content-Type: application/json' \
    --data "$result")

  wait
  output+=" $finished"
done
wait

echo $output
 */
