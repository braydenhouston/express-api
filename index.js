import fs from 'fs'
import path from 'path'
import express from 'express'
import crypto from 'crypto'
import { Low, JSONFile } from 'lowdb'

const app = express()
const port = process.env.PORT || 8081

const dataDir = '.data'
const dataPath = path.join(dataDir, 'data.json')

if (!fs.existsSync(dataDir)){
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Low(new JSONFile(dataPath))
await db.read()
db.data ||= {
  goats: [
    {
      id: 'f00000000000000d',
      name: "Gruff",
      powerLevel: 100,
      isGrumpy: true
    }
  ]
}
const { goats } = db.data

const generateId = () => {
  return crypto.randomBytes(8).toString('hex')
}

app.use(express.json()) // for parsing json encoded POST request

app.get('/', (request, response) => {
    console.log(request.url)
    response.json({
      'hello': true
    }) 
})

app.get('/api/goats', async (request, response) => {
  const result = goats
  response.json(result) 
})

app.get('/api/goats/:id', (request, response) => {
  const index = goats.findIndex(({ id }) => id === request.params.id)
  let result = goats[index]
  if (!result) {
    response.status(404)
    result = { error: "Goat not found 🐐"}
  }
  response.json(result) 
})

const update = async (request, response) => {
  const index = goats.findIndex(({ id }) => id === request.params.id)
  let result = goats[index]
  if (!result) {
    response.status(404)
    result = { error: "Goat not found 🐐"}
  }
  else {
    const dirtyGoat = request.body
    result = {
      id: result.id,
      name: dirtyGoat.name || result.name,
      powerLevel: dirtyGoat.powerLevel || result.powerLevel,
      isGrumpy: dirtyGoat.isGrumpy || result.isGrumpy,
    }
    goats[index] = result
    await db.write()
  }

  response.json(result) 
}

app.put('/api/goats/:id', update)
app.patch('/api/goats/:id', update)
app.post('/api/goats/:id', update)
app.delete('/api/goats/:id', async (request, response) => {
  const index = goats.findIndex(({ id }) => id === request.params.id)
  let result = { success: true }
  if (index === -1) {
    response.status(404)
    result = { error: "Goat not found 🐐"}
  }
  else {
    goats.splice(index, 1)
    await db.write()
  }

  response.json(result) 
})
app.post('/api/goats', async (request, response) => {
  const dirtyGoat = request.body
  const cleanGoat = {
    id: generateId(),
    name: dirtyGoat.name || null,
    powerLevel: dirtyGoat.powerLevel || null,
    isGrumpy: dirtyGoat.isGrumpy || false,
  }

  goats.push(cleanGoat)
  await db.write()
  response.json(cleanGoat) 
})



app.listen(port, () => {
    console.log(`Express server started on port ${port}`)
})
