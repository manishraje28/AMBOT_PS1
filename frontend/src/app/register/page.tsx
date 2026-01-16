'use client';

import { Suspense } from 'react';
import { RegisterForm } from './register-form';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
          >
            <h2 className="font-display text-3xl font-bold text-text-primary mb-2">
              Create your account
            </h2>
            <p className="text-text-secondary mb-8">
              Already have an account?{' '}
              <Link href="/login" className="link">
                Sign in
              </Link>
            </p>

            {/* Role Toggle */}
            <div className="flex gap-2 p-1 bg-surface-100 rounded-lg mb-8">
              {['student', 'alumni'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: role as 'student' | 'alumni' }))}
                  className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                    formData.role === role
                      ? 'bg-accent-primary text-surface'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {role === 'student' ? 'I\'m a Student' : 'I\'m an Alumni'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={validationErrors.firstName ? 'input-error' : 'input'}
                    placeholder="John"
                  />
                  {validationErrors.firstName && (
                    <p className="text-accent-danger text-sm mt-1">{validationErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={validationErrors.lastName ? 'input-error' : 'input'}
                    placeholder="Doe"
                  />
                  {validationErrors.lastName && (
                    <p className="text-accent-danger text-sm mt-1">{validationErrors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={validationErrors.email ? 'input-error' : 'input'}
                  placeholder="john@university.edu"
                />
                {validationErrors.email && (
                  <p className="text-accent-danger text-sm mt-1">{validationErrors.email}</p>
                )}
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`${validationErrors.password ? 'input-error' : 'input'} pr-12`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="text-accent-danger text-sm mt-1">{validationErrors.password}</p>
                )}
              </div>

              <div>
                <label className="label">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={validationErrors.confirmPassword ? 'input-error' : 'input'}
                  placeholder="••••••••"
                />
                {validationErrors.confirmPassword && (
                  <p className="text-accent-danger text-sm mt-1">{validationErrors.confirmPassword}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3.5 text-base"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <p className="text-text-tertiary text-sm text-center mt-6">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
