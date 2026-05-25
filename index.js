import chokidar from 'chokidar'
import { v2 as cloudinary } from 'cloudinary'
import axios from 'axios'
import { readFile, unlink } from 'fs/promises'
import { basename } from 'path'
import jwt from 'jsonwebtoken'

const config = JSON.parse(await readFile('/home/pi/spp-kiosk/spp-kiosk/spp-kiosk-node/config.json', 'utf8'))

cloudinary.config({ secure: true })

const api = axios.create({
  baseURL: config.environment == "production" ? config.api.production.apiRoot : config.api.staging.apiRoot,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
})

/** Extracts E.164 phone number from filenames of the form phone_NNNNNNNNNN_NNN.jpg */
const parsePhone = (filePath) => {
  const m = basename(filePath).match(/^phone_(\d{10})_\d{3}\.jpg$/)
  return m ? `+1${m[1]}` : null
}

console.log('starting watcher')
chokidar.watch('/home/pi/images').on('add', async (filePath) => {
  console.log('file detected:', filePath)

  const phone = parsePhone(filePath)
  const adminJwt = jwt.sign(
    { admin: config.credentials.admin },
    config.JWTSecret,
    { expiresIn: '1m' }
  )
  const headers = { Authorization: `Bearer ${adminJwt}` }

  let userId = null
  if (phone) {
    try {
      const userRes = await api.post('users/phone', { phone }, { headers })
      userId = userRes.data.user.id
      console.log('user resolved:', userId)
    } catch (e) {
      console.error('failed to resolve user by phone:', e.message)
      // non-fatal: photo is still registered, just unassociated
    }
  }

  let upload
  try {
    upload = await cloudinary.uploader.upload(filePath, {
      unique_filename: true,
      overwrite: true,
    })
    console.log('uploaded to cloudinary:', upload.secure_url)
  } catch (e) {
    console.error('cloudinary upload failed:', e)
    throw e
  }

  try {
    await api.post(
      `photos/${config.credentials.kiosk.id}`,
      {
        width: upload.width,
        height: upload.height,
        path: upload.secure_url,
        userId,
        isPublic: false,
      },
      { headers }
    )
    console.log('photo registered in API')
  } catch (e) {
    console.error('failed to register photo in API:', e)
    throw e
  }

  await unlink(filePath)
  console.log('deleted local file:', filePath)
})
