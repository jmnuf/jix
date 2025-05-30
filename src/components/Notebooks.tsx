import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Button } from './ui/button';
import { db, type Notebook } from '../lib/idb';
import { getUserId } from '../lib/utils';

interface AddNotebookFormProps {
  onCreated: (notebook: Notebook) => void;
}

export function AddNotebookForm(props: AddNotebookFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');

  const addNotebook = async () => {
    try {
      const id = crypto.randomUUID();
      const userId = await getUserId();
      await db.notebooks.add({
        id, name,
        creatorId: userId,
        synced: 0,
      });
      setStatus('Notebook created');
      const nb = (await db.notebooks.where('id').equals(id).first())!;
      props.onCreated(nb);
    } catch (err) {
      setStatus(`Failed to add notebook ${name}: ${err}`);
    }
  };

  return (
    <form
      className="flex flex-col gap-1"
      onSubmit={(event) => {
        event.preventDefault();
        if (isAdding) return;
        setIsAdding(true);
        addNotebook().finally(() => setIsAdding(false));
      }}
    >
      {status && <p>{status}</p>}
      <div className="flex gap-2 items-center">
        <label htmlFor="inpNotebookName">New Notebook Name:</label>
        <input
          className="px-2 py-1 border border-1 border-sky-400 rounded"
          id="inpNotebookName"
          type="text"
          name="name"
          aria-label="Notebook name"
          placeholder="Name"
          onChange={(event) => setName(event.target.value)} />
        <Button type="submit" className="px-2 py-1 rounded">Create</Button>
      </div>
    </form>
  );
}

interface ListNotebooksProps {
  onSelected: (notebook: Notebook) => void;
}

export function ListNotebooks(props: ListNotebooksProps) {
  const notebooks = useLiveQuery(() => db.notebooks.toArray()) ?? [];

  return (
    <ul className="flex flex-wrap gap-2">
      {notebooks.map((nb) => {
        return (
          <li key={nb.id}>
            <a href={`/u/${nb.creatorId}/notebook/${nb.id}`} onClick={(event) => {
              event.preventDefault();
              props.onSelected(nb);
            }}>
              <NoteboookCard nb={nb} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function NoteboookCard({ nb }: { nb: Notebook }) {
  const notesCount = useLiveQuery(() => db.notes.where('notebookId').equals(nb.id).count());
  const [emoji, setEmoji] = useState('');
  useEffect(() => {
    const all_emojis = ['📓', '📘', '📗', '📕', '📙', '📔'];
    const idx = Math.floor(Math.random() * all_emojis.length);
    setEmoji(all_emojis[idx] + ' ');
  }, [nb.id]);

  return (
    <Card className="min-w-[200px]">
      <CardHeader>
        <CardTitle>{emoji}{nb.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Holds {notesCount} notes</p>
      </CardContent>
    </Card>
  );
}

