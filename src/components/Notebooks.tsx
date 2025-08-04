import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Button } from './ui/button';
import { db, useNotebookNotesCount, useNotebooksList, type Notebook } from '../lib/idb';

interface AddNotebookFormProps {
  userId: string;
  onCreated: (notebook: Notebook) => void;
}

export function AddNotebookForm(props: AddNotebookFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const userId = props.userId;

  const addNotebook = async () => {
    try {
      const id = userId + ':' + crypto.randomUUID();
      await db.put_notebook({
        id, name,
        creatorId: userId,
        synced: 0,
        public: 1,
      });
      setStatus(`Created notebook: ${name}`);
      const nb = (await db.get_notebook(id))!;
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
  userId: string;
  onSelected: (notebook: Notebook) => void;
}

export function ListNotebooks(props: ListNotebooksProps) {
  const data = useNotebooksList(props.userId);
  if (data.loading) {
    return (
      <div className="flex flex-wrap gap-2">
        <p>Loading notebooks...</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {data.list.map((nb) => {
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
  const data = useNotebookNotesCount(nb.id);
  const [emoji, setEmoji] = useState('');
  useEffect(() => {
    const all_emojis = ['📓', '📘', '📗', '📕', '📙', '📔'];
    const idx = Math.floor(Math.random() * all_emojis.length);
    setEmoji(all_emojis[idx]);
  }, [nb.id]);

  return (
    <Card className="min-w-[200px]">
      <CardHeader>
        <CardTitle>{emoji}{' '}{nb.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{data.loading ? 'Counting notes...' : `Holds ${data.count} notes`}</p>
      </CardContent>
    </Card>
  );
}

