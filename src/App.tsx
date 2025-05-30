import { useState } from 'react';
import { AddNoteForm, ListNotes, NoteViewer } from './components/Notes';
import { AddNotebookForm, ListNotebooks } from './components/Notebooks';
import type { Note, Notebook } from './lib/idb';


function App() {
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  if (note) {
    return <NoteViewer note={note} onExit={() => setNote(null)} />
  }

  return (
    <div className="w-full pt-4 flex flex-col gap-4 items-center">
      {notebook
        ? (
          <>
            <h1>{notebook.name} Notes</h1>
            <AddNoteForm notebookId={notebook.id} onCreated={setNote} />
            <button onClick={() => setNotebook(null)}>Close Notebook</button>
            <ListNotes notebookId={notebook.id} onSelected={setNote} />
          </>
        ) : (
          <>
            <h1>My Notebooks</h1>
            <AddNotebookForm onCreated={setNotebook} />
            <ListNotebooks onSelected={setNotebook} />
          </>
        )}
    </div>
  )
}

export default App
