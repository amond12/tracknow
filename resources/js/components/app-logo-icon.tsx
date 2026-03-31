import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="16 16 32 32"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M32 20C25.3726 20 20 25.3726 20 32C20 38.6274 25.3726 44 32 44C38.6274 44 44 38.6274 44 32C44 25.3726 38.6274 20 32 20ZM32 26C32.8284 26 33.5 26.6716 33.5 27.5V32.25C33.5 32.6478 33.3419 33.0294 33.0607 33.3107L36.0607 36.3107C36.6464 36.8964 36.6464 37.8462 36.0607 38.4319C35.4749 39.0177 34.5251 39.0177 33.9393 38.4319L30.4393 34.9319C30.158 34.6506 30 34.269 30 33.8713V27.5C30 26.6716 30.6716 26 31.5 26H32Z"
            />
        </svg>
    );
}
