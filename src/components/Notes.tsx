import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Button } from './ui/button';
import { db, type Note } from '../lib/idb';
import { getUserId } from '../lib/utils';
import { MarkdownViewer } from './MarkdownViewer';

interface AddNoteFormProps {
  notebookId: string;
  onCreated: (note: Note) => void;
}

export function AddNoteForm({ notebookId, onCreated }: AddNoteFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');

  const addNote = async () => {
    try {
      const id = crypto.randomUUID();
      const userId = await getUserId();
      await db.notes.add({
        id, name,
        notebookId,
        content: '',
        creatorId: userId,
        synced: 0,
      });
      setStatus('Notebook created');
      const note = (await db.notes.where('id').equals(id).first())!;
      onCreated(note);
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
        addNote().finally(() => setIsAdding(false));
      }}
    >
      {status && <p>{status}</p>}
      <div className="flex gap-2 items-center">
        <label htmlFor="inpNoteName">New Note Name:</label>
        <input
          className="px-2 py-1 border border-1 border-sky-400 rounded"
          id="inpNoteName"
          type="text"
          name="name"
          aria-label="Note name"
          placeholder="Name"
          onChange={(event) => setName(event.target.value)} />
        <Button type="submit" className="px-2 py-1 rounded">Create</Button>
      </div>
    </form>
  );
}

interface ListNotesProps {
  notebookId: string;
  onSelected: (note: Note) => void;
}

export function ListNotes({ notebookId, onSelected }: ListNotesProps) {
  const notes = useLiveQuery(() => db.notes.where('notebookId').equals(notebookId).toArray(), [notebookId]) ?? [];

  return (
    <ul className="flex flex-wrap gap-2">
      {notes.map((n) => {
        return (
          <li key={n.id}>
            <a
              href={`/u/${n.creatorId}/note/${n.id}`}
              onClick={(event) => {
                event.preventDefault();
                onSelected(n);
              }}
            >
              <NoteCard note={n} />
            </a>
          </li>
        )
      })}
    </ul>
  );
}

function NoteCard({ note }: { note: Note }) {
  const [emoji, setEmoji] = useState('');
  useEffect(() => {
    const all_emojis = ['🖊️', '🖋️', '🥜'];
    const idx = Math.floor(Math.random() * all_emojis.length);
    setEmoji(all_emojis[idx] + ' ');
  }, [note.id]);

  return (
    <Card className="min-w-[200px]">
      <CardHeader>
        <CardTitle>{emoji}{note.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>...</p>
      </CardContent>
    </Card>
  )
}

interface NoteViewerProps {
  note: Note;
  onExit: () => void;
}

export function NoteViewer(props: NoteViewerProps) {
  const [note, setNote] = useState(props.note);
  const [content, setContent] = useState(note.content);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const todosInfo = useMemo(() => lexTodos(note.content), [note]);

  if (isEditing) {
    return (
      <article className="flex flex-col justify-center">
        <header className="flex-col w-full py-4 pb-2 justify-center items-center text-center">
          <h1>{props.note.name}</h1>
          <div className="flex justify-around">
            <Button
              type="button"
              disabled={isSaving}
              onClick={(event) => {
                event.preventDefault();
                setIsSaving(true);
                const updated: Note = { ...note, content, synced: 0 };
                saveNoteLocally(updated).then(() => {
                  setIsSaving(false);
                  setIsEditing(false);
                  setNote(updated);
                });;
              }}
            >Save</Button>

            <Button
              type="button"
              disabled={isSaving}
              onClick={(event) => {
                event.preventDefault();
                setIsEditing(false);
                setContent(note.content);
              }}
            >Cancel</Button>
          </div>
        </header>
        <textarea
          autoFocus
          autoCapitalize="off"
          className="w-3/4 mx-auto px-2 py-1 rounded"
          value={content}
          rows={20}
          disabled={isSaving}
          onChange={(event) => setContent(event.target.value)}
        ></textarea>
      </article>
    );
  }


  return (
    <article className="flex flex-col justify-center">
      <header className="flex-col w-full py-4 justify-center items-center text-center">
        <h1>{note.name}</h1>
        <div className="flex justify-around">
          <Button
            type="button"
            className=""
            onClick={(event) => {
              event.preventDefault();
              setIsEditing(true);
            }}
          >Edit</Button>

          <Button
            type="button"
            className=""
            onClick={(event) => {
              event.preventDefault();
              props.onExit();
            }}
          >Close</Button>
        </div>
      </header>
      <div className="w-3/4 mx-auto note-viewing">
        <MarkdownViewer content={note.content} onCheckboxChange={({ checked, index }) => {
          const info = todosInfo[index];
          if (!info) return;
          const args: [string, string] = checked ? ['- [x]', '- [ ]'] : ['- [ ]', '- [x]'];
          const line = info.line.replace(...args);
          const pre = note.content.substring(0, info.lineStart);
          const pst = note.content.substring(info.lineEnd);

          const newContent = `${pre}${line}${pst}`;
          const newNote = { ...note, content: newContent };

          setNote(newNote);
          setContent(newContent);
          saveNoteLocally(newNote);
        }} />
      </div>
    </article>
  );
}

function lexTodos(content: string) {
  let index = 0;
  const todos: Array<{ lineStart: number; lineEnd: number; line: string; }> = [];
  while (index < content.length) {
    const ch = content[index];
    if (ch == '\n') {
      index += 1;
      const lineStart = index;
      while (index < content.length) {
        index += 1
        if (content[index] == '\n') {
          break;
        }
      }
      const lineEnd = Math.min(index, content.length);
      const line = content.substring(lineStart, lineEnd);
      const trimed = line.trimStart();
      if (trimed.startsWith('- [ ] ') || trimed.startsWith('- [x] ') || trimed.startsWith('- [X] ')) {
        todos.push({ lineStart, lineEnd, line });
      }
      continue;
    }
    index += 1;
  }
  return todos;
}

const saveNoteLocally = (note: Note) =>
  db.notes.put(note)
    .then((value) => ({ ok: true, value } as const))
    .catch((error) => ({ ok: false, error } as const));


