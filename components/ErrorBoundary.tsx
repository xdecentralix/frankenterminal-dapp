import { Component, ReactNode } from "react";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
	state: State = { error: null };

	static getDerivedStateFromError(error: Error): State {
		return { error };
	}

	componentDidCatch(error: Error) {
		console.error(error);
	}

	render() {
		if (this.state.error) return this.props.fallback ?? null;
		return this.props.children;
	}
}
