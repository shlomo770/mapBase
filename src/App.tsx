import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import { WelcomeScreen } from './components/welcome/WelcomeScreen';
import { TopBar } from './components/layout/TopBar';
import { MapView } from './map/MapView';
import { DrawToolbar } from './components/toolbar/DrawToolbar';
import { EntitySidebar } from './components/sidebar/EntitySidebar';
import { ExampleForm } from './components/forms/ExampleForm';

const App: React.FC = () => {
  const rightOpen = useSelector((s: RootState) => s.ui.rightSidebarOpen);
  const welcomeScreenClosed = useSelector((s: RootState) => s.ui.welcomeScreenClosed);
  const exampleFormOpen = useSelector((s: RootState) => s.ui.exampleFormOpen);

  if (!welcomeScreenClosed) {
    return <WelcomeScreen />;
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar />
      <div className="flex flex-1 overflow-hidden bg-slate-950">
        <div className="relative flex-1">
          <MapView />
          <DrawToolbar />
        </div>
        {rightOpen && <EntitySidebar />}
      </div>
      {exampleFormOpen && <ExampleForm />}
    </div>
  );
};

export default App;


