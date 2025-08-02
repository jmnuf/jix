import Dexie, { type EntityTable } from 'dexie';

export type CBool = 0 | 1;

export interface Note {
  id: string;
  creatorId: string;
  notebookId: string;
  name: string;
  content: Uint8Array | ArrayBuffer;
  public: CBool;
  synced: CBool;
}

export type ParsedNote = {
  [K in keyof Note]: K extends 'content' ? string : Note[K];
}

export interface Notebook {
  id: string;
  creatorId: string;
  name: string;
  synced: CBool;
}

class JixDexie extends Dexie {
  notes!: EntityTable<Note, 'id', Note>;
  notebooks!: EntityTable<Notebook, 'id', Notebook>;

  constructor() {
    super('jix:notes');
    this.version(2)
      .stores({
        notes: 'id, creatorId, notebookId, name, content, public, synced',
        notebooks: 'id, creatorId, name, synced',
      })
      .upgrade(tx => {
        const encoder = new TextEncoder();
        return tx.table('notes')
          .toCollection()
          .modify(obj => {
            const pub = typeof obj.content == 'string';
            obj.content = pub ? encoder.encode(obj.content) : obj.content;
            obj.public = pub ? 1 : (obj.public ?? 1);
          });
      });

  }
}

export const db = new JixDexie();

