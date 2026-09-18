import { inject } from "@angular/core";
import { CanActivate, CanActivateFn, Router } from "@angular/router";
import { AuthService } from "./auth.service";

export const adminGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if(auth.isLoggedIn() && auth.isAdmin()){
        return true;
    }

    router.navigate(['/admin/dashboard']);
    return false;
}