
export type ReportedCasesTypes = {
    report_id: number
    longitude: number,
    latitude: number,
    city: string,
    province: string,
    district: string,
    reportedAt: string
    mollusk_type: string
    
    user_id: number
    status: string

    reporter_address: string
    reporter_name: string

}


export type ReportPerCity = {
    city: string
    reports_count: number
}


export type ReportPerProvince = {
    province: string
    reports_count: number
}

export type ReportsPerMollusk = {
    mollusk_type: string,
    mollusk_count: number
}


export type ReportsPerYear= {
    year: string,
    report_count: number
}