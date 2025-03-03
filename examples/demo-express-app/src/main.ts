/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { sunra } from '@sunra/client'
import * as sunraProxy from '@sunra/server-proxy/express'
import cors from 'cors'
import { configDotenv } from 'dotenv'
import express from 'express'
import * as path from 'path'
import multer from 'multer'
import fs from 'fs/promises'
import { Blob } from 'buffer'

const upload = multer({ dest: 'uploads/' })

configDotenv({ path: './env.local' })

const app = express()

// Middlewares
app.use('/assets', express.static(path.join(__dirname, 'assets')))
app.use(express.json())

// sunra client proxy
app.all(sunraProxy.route, cors(), sunraProxy.handler)

// Your API endpoints
app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to demo-express-app!' })
})

app.get('/sunra-on-server', async (req, res) => {
  // TODO: change the default model id
  const result = await sunra.run('fal-ai/any-llm', {
    input: {
      prompt:
        'a black cat with glowing eyes, cute, adorable, disney, pixar, highly detailed, 8k',
    },
  })
  res.send(result)
})

app.post('/sunra-upload-demo', upload.single('file'), async (req, res) => {
  const file: any = (req as any).file

  // read from req.file.path
  const buffer = await fs.readFile(file.path)
  const blob = new Blob([buffer], { type: file.mimetype })

  // TODO: change the default model id
  const result = await sunra.run('flux/dev/image-to-image', {
    input: {
      prompt:
        'a black cat with glowing eyes, cute, adorable, disney, pixar, highly detailed, 8k',
      file: blob
    },
  })
  res.send(result)
})

const port = process.env.PORT || 3333
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`)
})
server.on('error', console.error)
