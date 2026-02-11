import {FragmentDatabase} from './database';

async function main() {
    const db = await FragmentDatabase.create();

    // Get all theorems
    console.log('=== All Theorems ===\n');
    const theorems = db.getByType('theorem');
    theorems.forEach((t) => {
        console.log(`Theorem ${t.number}: ${t.content}`);
        console.log(`HTML: ${t.html}\n`);
    });

    // Get fragment by ID
    console.log('=== Get Fragment by ID ===\n');
    const fragment = db.getById('theorem_1_1');
    if (fragment) {
        console.log(`ID: ${fragment.id}`);
        console.log(`Type: ${fragment.type}`);
        console.log(`Number: ${fragment.number}`);
        console.log(`Content: ${fragment.content}`);
        console.log(`HTML: ${fragment.html}`);
        console.log(`Hash: ${fragment.sourceHash}`);
    }

    // Count by type
    console.log('\n=== Count by Type ===\n');
    const counts = db.countByType();
    Object.entries(counts).forEach(([type, count]) => {
        console.log(`${type}: ${count}`);
    });

    db.close();
}

main().catch(console.error);
