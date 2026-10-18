import { Component, type ReactNode } from "react";

export class AppErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <section className="boot-screen" role="alert">
          <h1>Mijn Woning</h1>
          <p>Er ging iets mis bij het openen van je dashboard.</p>
          <p>Vernieuw de pagina. Blijft dit gebeuren? Vermeld dan je browser en webversie 0.1.1.</p>
          <button onClick={() => window.location.reload()}>Opnieuw laden</button>
        </section>
      );
    }
    return this.props.children;
  }
}
