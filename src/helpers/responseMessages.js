module.exports = {
    //404 response
    notFound: ( message, res ) => {
        return res.status(404).json({ status: 'Not found', message: message, data:[] });
    },

    //400 response
    badRequest: ( message, res ) => {
        return res.status(400).json({ status: 'Bad request', message: message, data:[] });
    },

    //403 response
    forbidden: ( message, res ) => {
        return res.status(403).json({ status: 'Forbidden', message: message, data:[] });
    },

    //200 response
    success: ( message, data, res ) => {
        return res.status(200).json({ status: 'success', message: message, data: data });
    },

    //201 response
    created: ( message, data, res ) => {
        return res.status(201).json({ status: 'Created',message: message, data: data });
    },

    //200 response
    successfulLogin: ( token, message, data, res ) => {
        return res.header('Authorization', token).status(200).json({ status: 'success', message: message, data: data });
    },

    //206 response
    partialContent: (message, data, res) => {
        return res.status(206).json({ status: 'Partial content', message: message, data: data });
    },

    //401 response
    unauthorized: (message, res) => {
        return res.status(401).json({  status: 'Unauthorized', message: message || "You don't have permission to view this resource.", data: [] });
    },

    //500 response
    internalServerError: ( res ) => {
        return res.status(500).json({ status: 'Internal Server error', message: 'Something went wrong', data:[] });
    },

    globalErrorReporter: ( message, status, res ) => {
        return res.status(status).json({ status: 'Internal Server error', message: message });
    }
};
