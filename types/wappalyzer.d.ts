declare module 'wappalyzer' {
  interface WappalyzerOptions {
    debug?: boolean
    delay?: number
    headers?: Record<string, string>
    maxDepth?: number
    maxUrls?: number
    maxWait?: number
    recursive?: boolean
    probe?: boolean
  }

  interface Technology {
    name: string
    confidence: number
    categories: Array<{ id: number; name: string }>
  }

  interface AnalysisResult {
    technologies: Technology[]
  }

  interface Site {
    analyze(): Promise<AnalysisResult>
  }

  class Wappalyzer {
    constructor(options?: WappalyzerOptions)
    init(): Promise<void>
    open(url: string): Promise<Site>
    destroy(): Promise<void>
  }

  export default Wappalyzer
}
