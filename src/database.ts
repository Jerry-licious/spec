import initSqlJs from 'sql.js';
import {existsSync, readFileSync, writeFileSync} from 'fs';
import type {Fragment} from './types';

const DB_PATH = './fragments.db';

export class FragmentDatabase {
    private db: any;

    private constructor(db: any) {
        this.db = db;
    }

    static async create(): Promise<FragmentDatabase> {
        const SQL = await initSqlJs();

        let db;
        if (existsSync(DB_PATH)) {
            const buffer = readFileSync(DB_PATH);
            db = new SQL.Database(buffer);
        } else {
            db = new SQL.Database();
        }

        const instance = new FragmentDatabase(db);
        instance.initSchema();
        return instance;
    }

    insert(fragment: Fragment): void {
        this.db.run(
            `INSERT
            OR REPLACE INTO fragments (id, type, number, title, content, html, source_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                fragment.id,
                fragment.type,
                fragment.number,
                fragment.title || null,
                fragment.content,
                fragment.html,
                fragment.sourceHash,
            ]
        );
    }

    insertMany(fragments: Fragment[]): void {
        fragments.forEach((f) => this.insert(f));
    }

    getById(id: string): Fragment | null {
        const result = this.db.exec(
            `SELECT id, type, number, title, content, html, source_hash
             FROM fragments
             WHERE id = ?`,
            [id]
        );

        if (result.length === 0 || result[0].values.length === 0) return null;

        const row = result[0].values[0];
        return {
            id: row[0] as string,
            type: row[1] as any,
            number: row[2] as string,
            title: row[3] as string | undefined,
            content: row[4] as string,
            html: row[5] as string,
            sourceHash: row[6] as string,
        };
    }

    getByType(type: string): Fragment[] {
        const result = this.db.exec(
            `SELECT id, type, number, title, content, html, source_hash
             FROM fragments
             WHERE type = ?
             ORDER BY number`,
            [type]
        );

        if (result.length === 0) return [];

        return result[0].values.map((row: any[]) => ({
            id: row[0],
            type: row[1],
            number: row[2],
            title: row[3] || undefined,
            content: row[4],
            html: row[5],
            sourceHash: row[6],
        }));
    }

    getAll(): Fragment[] {
        const result = this.db.exec(`
            SELECT id, type, number, title, content, html, source_hash
            FROM fragments
            ORDER BY ROWID
        `);

        if (result.length === 0) return [];

        return result[0].values.map((row: any[]) => ({
            id: row[0],
            type: row[1],
            number: row[2],
            title: row[3] || undefined,
            content: row[4],
            html: row[5],
            sourceHash: row[6],
        }));
    }

    countByType(): Record<string, number> {
        const result = this.db.exec(
            `SELECT type, COUNT(*) as count
             FROM fragments
             GROUP BY type`
        );

        if (result.length === 0) return {};

        const counts: Record<string, number> = {};
        result[0].values.forEach((row: any[]) => {
            counts[row[0]] = row[1];
        });
        return counts;
    }

    save(): void {
        const data = this.db.export();
        writeFileSync(DB_PATH, data);
    }

    close(): void {
        this.db.close();
    }

    private initSchema(): void {
        this.db.run(`
            CREATE TABLE IF NOT EXISTS fragments
            (
                id
                TEXT
                PRIMARY
                KEY,
                type
                TEXT
                NOT
                NULL,
                number
                TEXT
                NOT
                NULL,
                title
                TEXT,
                content
                TEXT
                NOT
                NULL,
                html
                TEXT
                NOT
                NULL,
                source_hash
                TEXT
                NOT
                NULL,
                created_at
                TIMESTAMP
                DEFAULT
                CURRENT_TIMESTAMP
            )
        `);

        this.db.run(`CREATE INDEX IF NOT EXISTS idx_type ON fragments(type)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_number ON fragments(number)`);
    }
}
