
import { AppProviders } from "@/components/app/AppProviders";
import { AppRoutes } from "@/components/app/AppRoutes";

const App = () => {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
};

export default App;
