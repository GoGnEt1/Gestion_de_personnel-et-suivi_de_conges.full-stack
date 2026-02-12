import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/Home";
import Login from "./pages/Login";
import { useAuth } from "./context/useAuth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyCode from "./pages/VerifyCode";
import DemandeCongeForm from "./pages/DemandeCongeForm";
import HistoriqueDemandeConge from "./pages/HistoriqueDemandeConge";
import UserDashboard from "./pages/UserDashboard";

import AdminCongesTable from "./pages/AdminCongesTable";
import AdminDemandesTable from "./pages/AdminDemandesTable";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import UserLayout from "./components/UserLayout";
import PersonnelCongeDetails from "./pages/PersonnelCongeDetails";
import ParametresCompte from "./pages/ParametresCompte";

import PersonnelList from "./pages/PersonnelList";
import PersonnelDetails from "./pages/PersonnelDetails";
import AjoutPersonnelForm from "./pages/AjoutPersonnelForm";
import ImportPersonnel from "./pages/ImportPersonnel";
import FichePersonnel from "./components/FichePersonnel";
import FicheDemandeConge from "./components/FicheDemandeConge";
import FicheDemandeSortie from "./components/FicheDemandeSortie";
import FicheAttestationTravail from "./components/FicheAttestationTravail";

import DemandesEnLigne from "./pages/DemandesEnLigne";
import DemandeSortieForm from "./pages/DemandeSortieForm";
import AttestationTravailForm from "./pages/DemandeAttestationForm";

// règle de conges
import RegleConge from "./pages/RegleConge";
import ImportConges from "./pages/ImportConges";
import ModifierConge from "./pages/ModiferConge";
// routes
import PrivateRoute from "./routes/PrivateRoute";
import AdminRoute from "./routes/AdminRoute";

const App: React.FC = () => {
  const { login } = useAuth();

  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/" element={<Home />}>
        <Route
          path="/login"
          element={
            <Login
              setAuth={(auth: boolean) =>
                // login avec access et refresh commme paramètre
                login(
                  auth ? localStorage.getItem("access") || "" : "",
                  auth ? localStorage.getItem("refresh") || "" : "",
                )
              }
            />
          }
        />
      </Route>
      {/* <Route path="demandes-en-ligne" element={<DemandesEnLigne />} /> */}

      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="verify-code" element={<VerifyCode />} />
      <Route path="reset-password" element={<ResetPassword />} />

      {/* Routes pour les utilisateurs connectés */}
      <Route
        path="/dashboard/user"
        element={
          <PrivateRoute>
            <UserLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<UserDashboard />} />
        <Route path="demande-conges-form" element={<DemandeCongeForm />} />
        <Route path="historique-conges" element={<PersonnelCongeDetails />} />
        <Route
          path="mes-demandes-conges"
          element={<HistoriqueDemandeConge />}
        />
        <Route path="parametres-compte/:slug" element={<ParametresCompte />} />
        <Route path="mon-profil/:slug" element={<PersonnelDetails />} />

        <Route path="demande-sortie-form" element={<DemandeSortieForm />} />
        <Route
          path="attestation-travail-form"
          element={<AttestationTravailForm />}
        />
        <Route path="demandes-en-ligne" element={<DemandesEnLigne />} />
      </Route>

      {/* Routes pour les administrateurs */}
      <Route
        path="/dashboard/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="demandes-en-ligne" element={<DemandesEnLigne />} />

        <Route path="demande-conges-form" element={<DemandeCongeForm />} />
        <Route
          path="historique-conges/:slug"
          element={<PersonnelCongeDetails />}
        />
        <Route
          path="mes-demandes-conges"
          element={<HistoriqueDemandeConge />}
        />

        <Route path="ajout-personnel" element={<AjoutPersonnelForm />} />
        <Route path="import-personnel" element={<ImportPersonnel />} />
        <Route path="list-conges" element={<AdminCongesTable />} />
        <Route path="list-demandes" element={<AdminDemandesTable />} />
        <Route path="regle-conges" element={<RegleConge />} />
        <Route path="import-conges" element={<ImportConges />} />
        <Route path="modifie-conges" element={<ModifierConge />} />
        <Route path="list-personnels" element={<PersonnelList />} />
        <Route path="parametres-compte/:slug" element={<ParametresCompte />} />
        <Route path="personnel/:slug" element={<PersonnelDetails />} />
        <Route
          path="fiche-instruction"
          element={<FichePersonnel personnel={null} />}
        />
        <Route
          path="fiche-conges"
          element={<FicheDemandeConge personnel={null} />}
        />
        <Route
          path="fiche-sortie"
          element={<FicheDemandeSortie personnel={null} />}
        />
        <Route
          path="fiche-attestation-travail"
          element={<FicheAttestationTravail personnel={null} />}
        />

        <Route path="demande-sortie-form" element={<DemandeSortieForm />} />
        <Route
          path="attestation-travail-form"
          element={<AttestationTravailForm />}
        />
      </Route>

      {/* Route par défaut */}
      <Route path="/" element={<Home />} />
      {/* <Route path="/" element={<Navbar />} /> */}
      <Route path="*" element={<Navigate to="/" replace />} />
      {/* routes pour PersonnelDetails */}
    </Routes>
  );
};
export default App;
