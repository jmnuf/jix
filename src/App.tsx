import { useState } from 'react';
import { AddNoteForm, ListNotes, NoteViewer } from './components/Notes';
import { AddNotebookForm, ListNotebooks } from './components/Notebooks';
import { db } from './lib/idb';
import type { Note, Notebook } from './lib/idb';
import { useLiveQuery } from 'dexie-react-hooks';
import { useUserId } from './lib/utils';

function App() {
  const fetchingUserId = useUserId();
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [noteId, setNoteId] = useState<Note['id'] | null>(null);
  const note = useLiveQuery(() => noteId ? db.get_note(noteId) : undefined, [noteId]);

  if (fetchingUserId.loading) {
    return (
      <div className="w-full pt-4 flex flex-col gap-4 items-center">
        <p>Loading user...</p>
      </div>
    );
  }

  if (note) {
    return <NoteViewer note={note} onExit={() => setNoteId(null)} />;
  }

  const userId = fetchingUserId.userId;

  return (
    <div className="w-full pt-4 flex flex-col gap-4 items-center">
      {notebook
        ? (
          <>
            <h1>{notebook.name} Notes</h1>
            <AddNoteForm userId={userId} notebookId={notebook.id} onCreated={n => setNoteId(n.id)} />
            <button onClick={() => setNotebook(null)}>Close Notebook</button>
            <ListNotes notebookId={notebook.id} onSelected={setNoteId} />
          </>
        ) : (
          <>
            <h1>My Notebooks</h1>
            <AddNotebookForm userId={userId} onCreated={setNotebook} />
            <ListNotebooks userId={userId} onSelected={setNotebook} />
          </>
        )}
    </div>
  )
}

export default App
