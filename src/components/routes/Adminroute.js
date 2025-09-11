
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/auth';
import Spinner from '../Spinner';
import { adminRouteApi } from '../../service/allApis';

export default function AdminRoute() {
  const [ok, setOk] = useState(null);
  const [auth] = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!auth?.token || auth.user?.userType !== 'Admin') {
      setOk(false);
      return;
    }

    (async () => {
      try {
        const res = await adminRouteApi();
        setOk(Boolean(res?.data?.ok));
      } catch {
        setOk(false);
      }
    })();
  }, [auth?.token, auth?.user]);

  if (ok === null) {
    return <Spinner message="Verifying admin access…" seconds={5} redirect={false} />;
  }

  if (!ok) {

    return <Spinner message="Access Denied" seconds={5} redirect={false} to="/" />;
  }

  return <Outlet />;
}






