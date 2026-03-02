import { Link } from 'react-router-dom';

const Header = () => {
    return (
        <header className="px-5 py-4 flex items-center sticky top-0 bg-inherit z-10">
            <Link to="/" className="no-underline color-inherit">
                <h1 className="m-0 text-2xl font-extrabold text-accent tracking-tighter font-serif">
                    Spark
                </h1>
            </Link>
        </header>
    );
};

export default Header;
