/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            allowedOrigins: [
                'localhost:3000',
                '13da-114-10-27-37.ngrok-free.app',
            ]
        }
    },
}

module.exports = nextConfig
