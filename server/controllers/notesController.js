const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')


// @desc Get all notes
// @route GET /notes
// @access Private
const getAllNotes = asyncHandler (async (req, res) => {
    // Get all notes from MongoDB
    const notes = await Note.find().lean()

    // If no notes 
    if (!notes?.length) {
        return res.status(400).json({ message: 'No notes found' })
    }

    //add username to each note before sending response
    const notesWithUser = await Promise.all(notes.map(async (note) => {
        const user = await User.findById(note.user).lean().exec()
        return { ...note, username: user.username }
    }))
    res.json(notesWithUser)

})

// @desc Create new note
// @route POST /notes
// @access Private
const createNewNote = asyncHandler(async (req, res) => {
    const { user, title, text } = req.body

    // Confirm data
    if (!user || !title || !text) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    // Check for duplicate title
    const duplicate = await Note.findOne({ username }).lean().exec()

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate note tile' })
    }


    // Create and store new note 
    const note = await Note.create({user, title, text})

    if (note) { //created 
        res.status(201).json({ message: 'New note created'})
    } else {
        res.status(400).json({ message: 'Invalid user data received' })
    }
})

// @desc Update a user
// @route PATCH /users
// @access Private
const updateNote = asyncHandler(async (req, res) => {
    const { id, user, title, text, completed } = req.body

    // Confirm data 
    if (!id || !user || !title || typeof completed !== 'boolean') {
        return res.status(400).json({ message: 'All fields  are required' })
    }

    // Does the note exist to update?
    const note = await Note.findById(id).exec()

    if (!note) {
        return res.status(400).json({ message: 'Note not found' })
    }

    // Check for duplicate title
    const duplicate = await Note.findOne({ title }).lean().exec()

    // Allow updates to the original note 
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate title' })
    }

    note.user = user
    note.title = title
    note.text = text
    note.completed = completed


    const updatedNote = await note.save()

    res.json({ message: `${updatedNote.title} updated` })
})

// @desc Delete a user
// @route DELETE /users
// @access Private
const deleteNote = asyncHandler(async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'Note ID Required' })
    }

    // confirm note exists
    const note = await Note.findOne(id).exec()
    if (!note) {
        return res.status(400).json({ message: 'Note not Find' })
    }

    const result = await note.deleteOne()

    const reply = `Note '${result.tile}' with ID ${result._id} deleted`

    res.json(reply)

    
})

module.exports = {
    getAllNotes,
    createNewNote,
    updateNote,
    deleteNote
}