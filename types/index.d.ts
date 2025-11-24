export type Environment = 'sandbox' | 'production'

export type ProxyOptions =
  | string
  | {
      protocol: 'http' | 'socks'
      host: string
      port: number
      username?: string
      password?: string
    }

export interface PayPalOptions {
  clientId: string
  clientSecret: string
  environment?: Environment
  proxy?: ProxyOptions
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD'

export interface ExecuteOptions {
  method?: HttpMethod
  url: string
  headers?: Record<string, string | number | boolean>
  body?: any
}

export default class PayPal {
  constructor (options?: PayPalOptions)
  execute<T = any> (options: ExecuteOptions): Promise<T>
}
