import { useState } from 'react';
import { AddNoteForm, ListNotes, NoteViewer } from './components/Notes';
import { AddNotebookForm, ListNotebooks } from './components/Notebooks';
import { db } from './lib/idb';
import type { Note, Notebook } from './lib/idb';
import { useLiveQuery } from 'dexie-react-hooks';

function App() {
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [noteId, setNoteId] = useState<Note['id'] | null>(null);
  const note = useLiveQuery(() => db.notes.get(noteId ?? ''), [noteId]);
  if (note) {
    return <NoteViewer note={note} onExit={() => setNoteId(null)} />;
  }

  return (
    <div className="w-full pt-4 flex flex-col gap-4 items-center">
      {notebook
        ? (
          <>
            <h1>{notebook.name} Notes</h1>
            <AddNoteForm notebookId={notebook.id} onCreated={n => setNoteId(n.id)} />
            <button onClick={() => setNotebook(null)}>Close Notebook</button>
            <ListNotes notebookId={notebook.id} onSelected={setNoteId} />
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
