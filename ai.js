
const geminiAi = async (req, res) => {
    const { prompt, apikey } = req.query;

    if (!prompt) {
        return res.status(400).send({
            status: 400,
            message: "Parameter 'prompt' is required",
        });
    }

    if (!apikey) {
        return res.status(403).send({
            status: 403,
            message: "Parameter 'apikey' is required",
        });
    }

    // Simulasi respons dari Google Gemini AI
    try {
        const response = {
            status: 200,
            message: "Gemini AI Response",
            data: {
                prompt: prompt,
                result: `Simulated response for: ${prompt}`,
            },
        };
        res.status(200).send(response);
    } catch (error) {
        res.status(500).send({
            status: 500,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

module.exports = { geminiAi };
