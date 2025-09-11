

import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/auth';
import Spinner from '../Spinner';
import { privateRouteApi } from '../../service/allApis';

export default function PrivateRoute() {
  const [ok, setOk] = useState(null); // null = loading, true/false final
  const [auth] = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!auth?.token) {
      setOk(false);
      return;
    }

    // quick client-side role block (admins should not see user dashboard)
    if (auth?.user?.userType === 'Admin') {
      setOk(false);
      return;
    }

    // server validation 
    const authCheck = async () => {
      try {
        const res = await privateRouteApi();
        setOk(Boolean(res?.data?.ok));
      } catch (err) {
        setOk(false);
      }
    };

    authCheck();
  }, [auth?.token, auth?.user]);

  if (ok === null) {
    return <Spinner message="Verifying user access…" seconds={5} redirect={false} />;
  }

  if (!ok) {
    // Show access denied spinner without redirection
    return <Spinner message="Access Denied" seconds={5} redirect={false} />;
  }


  return <Outlet />;
}
