import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'

import eventsRouter from './routes/events'
import availabilityRouter from './routes/availability'
import teamsRouter from './routes/teams'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(helmet())
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/events', eventsRouter)
app.use('/api/availability', availabilityRouter)
app.use('/api/teams', teamsRouter)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
