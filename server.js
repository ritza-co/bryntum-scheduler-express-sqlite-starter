import bodyParser from 'body-parser';
import express from 'express';
import path from 'path';
import { Assignment, Dependency, Event, Resource } from './models/index.js';

global.__dirname = path.resolve();

const port = 1337;
const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(
    express.static(path.join(__dirname, '/node_modules/@bryntum/scheduler'))
);

app.use(bodyParser.json());

app.get('/load', async(req, res) => {
    try {
        const assignmentsPromise = Assignment.findAll();
        const dependenciesPromise = Dependency.findAll();
        const eventsPromise = Event.findAll();
        const resourcesPromise = Resource.findAll();
        const [assignments, dependencies, events, resources] = await Promise.all([
            assignmentsPromise,
            dependenciesPromise,
            eventsPromise,
            resourcesPromise
        ]);
        res
            .send({
                assignments  : { rows : assignments },
                dependencies : { rows : dependencies },
                events       : { rows : events },
                resources    : { rows : resources }
            })
            .status(200);
    }
    catch (error) {
        console.error({ error });
        res.send({
            success : false,
            message :
        'There was an error loading the assignments, dependencies, events, and resources data.'
        });
    }
});

app.post('/sync', async function(req, res) {
    const { requestId, assignments, dependencies, events, resources } = req.body;

    const eventMapping = {};

    try {
        const response = { requestId, success : true };

        if (resources) {
            const rows = await applyTableChanges('resources', resources);
            // if new data to update client
            if (rows) {
                response.resources = { rows };
            }
        }

        if (events) {
            const rows = await applyTableChanges('events', events);
            if (rows) {
                if (events?.added) {
                    rows.forEach((row) => {
                        eventMapping[row.$PhantomId] = row.id;
                    });
                }
                response.events = { rows };
            }
        }

        if (assignments) {
            if (events && events?.added) {
                assignments.added.forEach((assignment) => {
                    assignment.eventId = eventMapping[assignment.eventId];
                });
            }
            const rows = await applyTableChanges('assignments', assignments);
            if (rows) {
                response.assignments = { rows };
            }
        }

        if (dependencies) {
            const rows = await applyTableChanges('dependencies', dependencies);
            if (rows) {
                response.dependencies = { rows };
            }
        }
        res.send(response);
    }
    catch (error) {
        console.error({ error });
        res.send({
            requestId,
            success : false,
            message : 'There was an error syncing the data changes.'
        });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

async function applyTableChanges(table, changes) {
    let rows;
    if (changes.added) {
        rows = await createOperation(changes.added, table);
    }
    if (changes.updated) {
        await updateOperation(changes.updated, table);
    }
    if (changes.removed) {
        await deleteOperation(changes.removed, table);
    }
    // if got some new data to update client
    return rows;
}

function createOperation(added, table) {
    return Promise.all(
        added.map(async(record) => {
            const { $PhantomId, ...data } = record;
            let id;
            // Insert record into the table.rows array
            if (table === 'assignments') {
                const assignment = await Assignment.create(data);
                id = assignment.id;
            }
            if (table === 'dependencies') {
                const dependency = await Dependency.create(data);
                id = dependency.id;
            }
            if (table === 'events') {
                const event = await Event.create(data);
                id = event.id;
            }
            if (table === 'resources') {
                const resource = await Resource.create(data);
                id = resource.id;
            }
            // report to the client that we changed the record identifier
            return { $PhantomId, id };
        })
    );
}

function updateOperation(updated, table) {
    return Promise.all(
        updated.map(async({ id, ...data }) => {
            if (table === 'assignments') {
                await Assignment.update(data, { where : { id } });
            }
            if (table === 'dependencies') {
                await Dependency.update(data, { where : { id } });
            }
            if (table === 'events') {
                await Event.update(data, { where : { id } });
            }
            if (table === 'resources') {
                await Resource.update(data, { where : { id } });
            }
        })
    );
}

function deleteOperation(deleted, table) {
    return Promise.all(
        deleted.map(async({ id }) => {
            if (table === 'assignments') {
                await Assignment.destroy({
                    where : {
                        id : id
                    }
                });
            }
            if (table === 'dependencies') {
                await Dependency.destroy({
                    where : {
                        id : id
                    }
                });
            }
            if (table === 'events') {
                await Event.destroy({
                    where : {
                        id : id
                    }
                });
            }
            if (table === 'resources') {
                await Resource.destroy({
                    where : {
                        id : id
                    }
                });
            }
        })
    );
}