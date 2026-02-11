import {FragmentDatabase} from './database';
import {fragments} from './parse';

async function main() {
    console.log('\n=== Storing fragments ===\n');

    const db = await FragmentDatabase.create();

    db.insertMany(fragments);

    db.save();

    console.log(`Stored ${fragments.length} fragments\n`);

    const all = db.getAll();
    all.forEach((f) => {
        console.log(
            `  ${f.id.padEnd(20)} | ${f.type.padEnd(10)} ${f.number.padEnd(6)} | HTML: ${f.html.length} bytes`
        );
    });

    db.close();
}

main().catch(console.error);
