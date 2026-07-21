type WelcomeProps = {
    name: string;
};

export default function WelcomeBanner({name}: WelcomeProps) {
    return (
        <header>
            <h2 className="mb-2 text-3x1 font-bold">
            Welcome back, {name}!
            </h2>
            <p className="text-gray-400">
                Let&apos;s optimize your Etsy shop today.
             </p>
        </header>
    );
}