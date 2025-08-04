import Dexie, { type EntityTable } from 'dexie';
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { EncryptionHelper } from './utils';

export type CBool = 0 | 1;

export type RawBytes = Uint8Array | ArrayBuffer;

type ParsedItem<T> = {
  [K in keyof T]: T[K] extends RawBytes ? string : T[K];
} & unknown;
type EncodedItem<T, Keys extends Array<keyof T>> = {
  [K in keyof T]: K extends Keys[number] ? T[K] extends string ? RawBytes : T[K] : T[K];
} & unknown;

export interface RawNote {
  id: string;
  creatorId: string;
  notebookId: string;
  name: RawBytes;
  content: RawBytes;
  public: CBool;
  synced: CBool;
}
export type Note = ParsedItem<RawNote>;


export interface RawNotebook {
  id: string;
  creatorId: string;
  name: RawBytes;
  public: CBool;
  synced: CBool;
}
export type Notebook = ParsedItem<RawNotebook>;

type ParseFieldConfig<T extends Record<string, any>> = {
  item: T;
  encryption?: EncryptionHelper;
};
function parse_fields<T extends Record<string, any>>({
  item,
  encryption,
}: ParseFieldConfig<T>): ParsedItem<T> {
  const parsed: Record<string, any> = {} as any;
  const decoder = new TextDecoder();
  const decode = encryption
    ? (bytes: RawBytes) => decoder.decode(encryption.decrypt(bytes))
    : (bytes: RawBytes) => decoder.decode(bytes)
    ;

  for (const key of Object.keys(item)) {
    const val = item[key]!;
    if (val instanceof Uint8Array || val instanceof ArrayBuffer) {
      const decoded_value = decode(val);
      parsed[key] = decoded_value;
      continue;
    }
    parsed[key] = val;
  }
  return parsed as ParsedItem<T>;
}

function encode_fields<T extends Record<string, any>, const Keys extends Array<keyof T>>(item: T, fields: Keys, encryption?: EncryptionHelper): EncodedItem<T, Keys> {
  const encoded_item: Record<string, any> = {};
  const encoder = new TextEncoder();
  const encode = encryption
    ? (text: string) => encryption.encrypt(encoder.encode(text))
    : (text: string) => encoder.encode(text)
    ;

  for (const key of Object.keys(item)) {
    const val = item[key]!;
    if (fields.includes(key) && typeof val == 'string') {
      const encoded_value = encode(val);
      encoded_item[key] = encoded_value;
      continue;
    }
    encoded_item[key] = val;
  }
  return encoded_item as EncodedItem<T, Keys>;
}

const parse_raw_note = (n: RawNote, encryption?: EncryptionHelper): Note =>
  parse_fields({ item: n, encryption });
const parse_raw_notebook = (nb: RawNotebook, encryption?: EncryptionHelper): Notebook =>
  parse_fields({ item: nb, encryption });

const encode_note = (n: Note, encryption?: EncryptionHelper): RawNote =>
  encode_fields(n, ['name', 'content'], encryption);
const encode_notebook = (nb: Notebook, encryption?: EncryptionHelper): RawNotebook =>
  encode_fields(nb, ['name'], encryption);


class JixDexie extends Dexie {
  notes!: EntityTable<RawNote, 'id', RawNote>;
  notebooks!: EntityTable<RawNotebook, 'id', RawNotebook>;

  constructor() {
    super('jix:noter');
    this.version(1)
      .stores({
        notes: 'id, creatorId, notebookId, name, content, public, synced',
        notebooks: 'id, creatorId, name, synced',
      });
  }

  put_note = (note: Note, encryption?: EncryptionHelper): Promise<string> =>
    this.notes
      .put(encode_note(note, encryption));

  put_notebook = (notebook: Notebook, encryption?: EncryptionHelper): Promise<string> =>
    this.notebooks
      .put(encode_notebook(notebook, encryption));

  get_note = (id: string, encryption?: EncryptionHelper): Promise<Note | undefined> =>
    this.notes
      .get(id)
      .then(n => n ? parse_raw_note(n, encryption) : n);

  get_notebook = (id: string, encryption?: EncryptionHelper): Promise<Notebook | undefined> =>
    this.notebooks
      .get(id)
      .then(n => n ? parse_raw_notebook(n, encryption) : n);

  list_all_notebooks = (userId: string, encryption?: EncryptionHelper): Promise<Notebook[]> =>
    this.notebooks
      .where('creatorId')
      .equals(userId)
      .toArray()
      .then(list => list.map(nb => parse_raw_notebook(nb, encryption)));

  list_notes_from_notebook = (id: string, encryption?: EncryptionHelper): Promise<Note[]> =>
    this.notes
      .where('notebookId')
      .equals(id)
      .toArray()
      .then(list => list.map(n => parse_raw_note(n, encryption)));
}

export const db = new JixDexie();

export function useNotebooksList(userId: string) {
  const [loading, setLoading] = useState(true);
  const list = useLiveQuery(
    () => db.list_all_notebooks(userId),
    [userId],
  );

  if (!list && !loading) {
    setLoading(true);
  } else if (list && loading) {
    setLoading(false);
  }

  return { loading, list } as { loading: true } | { loading: false; list: Notebook[] };
}

export function useNotebookNotesCount(notebookId: string) {
  const [loading, setLoading] = useState(true);
  const count = useLiveQuery(
    () => db.notes.where('notebookId').equals(notebookId).count(),
    [notebookId],
  );
  if (count === undefined && !loading) {
    setLoading(true);
  } else if (count !== undefined && loading) {
    setLoading(false);
  }
  return { loading, count } as { loading: true } | { loading: false; count: number };
}

export function useNotesListFromNotebook(notebookId: string) {
  const [loading, setLoading] = useState(true);
  const list = useLiveQuery(
    () => db.list_notes_from_notebook(notebookId),
    [notebookId]
  );

  if (!list && !loading) {
    setLoading(true);
  } else if (list && loading) {
    setLoading(false);
  }
  return { loading, list } as { loading: true } | { loading: false; list: Note[] };
}

