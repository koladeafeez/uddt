const error404 = 'Sorry, the resource you are looking for was not found.';

module.exports = function (app) {
    app.get('*', (req, res) => res.status(404).json({ message: error404 }));
    app.post('*', (req, res) => res.status(404).json({ message: error404 }));
    app.put('*', (req, res) => res.status(404).json({ message: error404 }));
    app.delete('*', (req, res) => res.status(404).json({ message: error404 }));
};