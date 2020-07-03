import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

const withDB = async (operations, res) => {
    try {
        // const articleName = req.params.name;

        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true })
        const db = client.db('my-blog')

        await operations(db)
        // const articleInfo = await db.collection('articles').findOne({ name: articleName })
        // res.status(200).json(articleInfo);
        client.close();

    } catch (err) {
        res.status(500).json({ message: 'Error connecting to db', err })
    }


}
// app.post('/api/articles/:name/upvote', (req, res) => {
//     console.log(req.params.name)
//     const articleName = req.params.name;

//     articlesInfo[articleName].upvotes += 1
//     res.status(200).send(`${articleName} now has ${articlesInfo[articleName].upvotes} upvotes.`)
// })

// app.post('/api/articles/:name/add-comment', (req, res) => {
//     const {username, text} = req.body

//     const articleName = req.params.name;
//     articlesInfo[articleName].comments.push({username, text});
//     res.status(200).send(articlesInfo[articleName])


// })

app.get('/api/articles/:name', async (req, res) => {

    withDB(async (db) => {
        const articleName = req.params.name;
        const articleInfo = await db.collection('articles').findOne({ name: articleName })
        res.status(200).json(articleInfo);
    }, res)

})

app.post('/api/articles/:name/upvote', async (req, res) => {

    withDB(async (db) => {
        const articleName = req.params.name;

        const articleInfo = await db.collection('articles').findOne({ name: articleName })
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                upvotes: articleInfo.upvotes + 1,
            },
        })

        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName })
        res.status(200).json(updatedArticleInfo)
    }, res)
})

app.post('/api/articles/:name/add-comment', (req, res) => {

    const { username, text } = req.body
    const articleName = req.params.name;
    // articlesInfo[articleName].comments.push({username, text});
    // res.status(200).send(articlesInfo[articleName])
    withDB(async (db) => {
        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                comments: articleInfo.comments.concat({ username, text }),
            },
        });

        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName })
        res.status(200).json(updatedArticleInfo);
    }, res)

})

//all request caught by other api routes passed to the index html file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
})

app.listen(8000, () => console.log('Listening on port 8000'));