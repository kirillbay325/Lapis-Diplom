import React, { useEffect } from "react";
import { Route, Routes } from 'react-router-dom';
import './App.css'
import Header from "./Header/Header";
import Main from "./Main/Main";
import Profile from "./Profile/Profile";
import AllOrder from "./AllOrder/AllOrder";
import TransactionHistory from "./Profile/TransactionHistory";
import Services from "./Services/Services";
import ServicesList from "./Services/ServicesList";
import AddService from "./Services/AddService";
import Full_Services from "./Full_Services/Full_Services";
import Footer from "./Footer/Footer";
import useSmoothScroll from './useSmoothScroll';
import { AlertProvider } from './Alert/AlertContext';
import AlertSystem from './Alert/AlertSystem';


const LazyLoadingProfile = React.lazy(() => import('./Profile/Profile'));
const LazyLoadingFullServices = React.lazy(() => import('./Full_Services/Full_Services'));
const LazyLoadingServicesList = React.lazy(() => import('./Services/ServicesList'));
const LazyLoadingAddService = React.lazy(() => import('./Services/AddService'));
const LazyLoadingAllOrder = React.lazy(() => import('./AllOrder/AllOrder'));
const LazyLoadingTransactionHistory = React.lazy(() => import('./Profile/TransactionHistory'));


function App() {
  useEffect(() => {
  const handleStorageChange = () => {
  };
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);
  useSmoothScroll();



  

  return (
    <>
      <AlertProvider>
        <Header />
        
          <Routes> 
            <Route path="/" element={
            <>
              <Main />
              <Services /> 
            </>}/>

            <Route path="/Profile" element={<LazyLoadingProfile />} />
            <Route path="/Full_Services" element={<LazyLoadingFullServices />} />
            <Route path="/ServicesList" element={<LazyLoadingServicesList />} />
            <Route path="/AddService" element={<LazyLoadingAddService />} />
            <Route path="/AllOrder" element={<LazyLoadingAllOrder />} />
            <Route path="/TransactionHistory" element={<LazyLoadingTransactionHistory />} />
            
          </Routes>
          <Footer />
          <AlertSystem style={{display: 'none'}} />
        </AlertProvider>
    </>

    

  )
}

export default App; 