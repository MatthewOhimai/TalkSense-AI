import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-bg-primary)] p-6 text-center">
            <h1 className="text-6xl font-bold text-[var(--color-primary)] mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-[var(--color-text-main)] mb-6">Page Not Found</h2>
            <p className="text-[var(--color-text-muted)] mb-8 max-w-md">
                Sorry, the page you are looking for does not exist or has been moved.
            </p>
            <div className="flex gap-4">
                <Button variant="outline" onClick={() => navigate(-1)}>
                    Go Back
                </Button>
                <Button onClick={() => navigate('/')}>
                    Go Home
                </Button>
            </div>
        </div>
    );
};

export default NotFound;
