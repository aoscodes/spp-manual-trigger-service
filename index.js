import chokidar from 'chokidar'
import cloudinary from 'cloudinary'
import axios from 'axios'
import { readFile } from 'fs/promises'
import { unlink } from 'fs'


const config = JSON.parse(
  await readFile(
    new URL('/home/pi/config.json', import.meta.url)
  )
);

const api = axios.create({
  baseURL: config.api.production.apiRoot,
  timeout: 1000,
  headers: { "Content-Type": "application/json" },
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

  return await cloudinary.uploader.upload(path, options)
}

const create_photo = async upload_data => api.post(`photos/${config.credentials.location.id}/${config.credentials.location.token}`, {
  width: upload_data.width,
  height: upload_data.height,
  path: upload_data.url,
  isPublic: false
})

console.log("starting watcher")
chokidar.watch('/home/pi/images').on('add', async (path, _) => {
  console.log("uploading to cloudinary", path)
  let result
  try {
    result = await upload_cloudinary(path)
    console.log("uploaded to cloudinary successfully!", result)
  } catch (e) {
    console.error("failed to upload to cloudinary", e)
    throw e
  }

  try {
    console.log("creating photo on spp backend")
    result = await create_photo(result)
    console.log("created photo in spp backend", result)
  } catch (e) {
    console.error("failed to create photo in spp backend", e)
    throw e
  }

  unlink(path, e => {
    if (e) {
      console.error("failed to unlink file", e)
      throw e
    }
  })
  console.log("unlinked file")
})

