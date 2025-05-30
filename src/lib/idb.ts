import Dexie, { type EntityTable } from 'dexie';

export type CBool = 0 | 1;

export interface Note {
  id: string;
  creatorId: string;
  notebookId: string;
  name: string;
  content: string;
  synced: CBool;
}

export interface Notebook {
  id: string;
  creatorId: string;
  name: string;
  synced: CBool;
}

class JixDexie extends Dexie {
  notes!: EntityTable<Note>;
  notebooks!: EntityTable<Notebook>;

  constructor() {
    super('jix:notes');
    this.version(1).stores({
      notes: 'id, creatorId, notebookId, name, content, synced',
      notebooks: 'id, creatorId, name, synced',
    });
  }
}

export const db = new JixDexie();

