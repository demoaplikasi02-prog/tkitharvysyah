
import { Score } from '../types';

// GANTI URL DI BAWAH INI DENGAN URL DARI GOOGLE APPS SCRIPT YANG SUDAH ANDA DEPLOY
// Link Spreadsheet: https://docs.google.com/spreadsheets/d/1N8sNwCUIDHVs6sUBSPigIo1dYEia3iWxjzaSAF5oUys/edit
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxLZH9UZv16MVRL8KVRXJOPxO0TvdBNAPyILE-TKHoboigkHCXNnTZ_Mnt-u4UFUCT-/exec'; 

const TEACHER_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSyZ_2P34BexY86zG6Vv6EZP35MYRFPfyGK33bOHfaKNyWA869DzWvsXTiDopbGIouwBaWRsAHx9JQd/pub?gid=1199552512&single=true&output=csv';
const STUDENT_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSyZ_2P34BexY86zG6Vv6EZP35MYRFPfyGK33bOHfaKNyWA869DzWvsXTiDopbGIouwBaWRsAHx9JQd/pub?gid=61009661&single=true&output=csv';
const HAFALAN_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSyZ_2P34BexY86zG6Vv6EZP35MYRFPfyGK33bOHfaKNyWA869DzWvsXTiDopbGIouwBaWRsAHx9JQd/pub?gid=1814146332&single=true&output=csv';
const PRINCIPAL_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSyZ_2P34BexY86zG6Vv6EZP35MYRFPfyGK33bOHfaKNyWA869DzWvsXTiDopbGIouwBaWRsAHx9JQd/pub?gid=1299153441&single=true&output=csv';
// Update link CSV SPP sesuai permintaan
const SPP_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRHV_zCD9sHzJGKn8hNwSirhNvG4XELjDpSbdhzf9w4uRKZpb7MiOqYJ4ssS6-WIaNSysV5zSROEnO3/pub?gid=0&single=true&output=csv'; 

/**
 * A robust CSV parser that handles quoted values and headers correctly.
 * @param csvText The text content of the CSV file.
 * @returns An array of objects.
 */
const parseCSV = <T,>(csvText: string): T[] => {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) {
        return [];
    }

    // Helper function to parse a single CSV line handling quotes
    const parseLine = (line: string): string[] => {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (const char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        
        // Remove surrounding quotes from values if they exist
        return values.map(v => v.replace(/^"|"$/g, '').trim());
    };

    // Parse headers using the same logic to ensure quoted headers (e.g., "Item Name") are cleaned
    const headers = parseLine(lines[0]);
    const data: T[] = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i]) continue;

        const values = parseLine(lines[i]);

        if (values.length === headers.length) {
            const entry = {} as T;
            headers.forEach((header, index) => {
                // Type assertion to allow dynamic property assignment
                (entry as any)[header] = values[index];
            });
            data.push(entry);
        }
    }
    return data;
};

const fetchFromWebApp = async <T,>(sheetName: string): Promise<T[]> => {
    const response = await fetch(`${WEB_APP_URL}?action=getData&sheet=${sheetName}`);
    if (!response.ok) {
        throw new Error(`Error fetching ${sheetName} data from Web App: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.error) {
        throw new Error(data.error);
    }
    return data as T[];
};

export const getSheetData = async <T,>(sheetName: string): Promise<T[]> => {
    let csvUrl = '';
    
    // Gunakan CSV untuk data statis (Guru, Siswa, Hafalan, Principal)
    if (sheetName === 'Teacher') csvUrl = TEACHER_CSV_URL;
    else if (sheetName === 'Student') csvUrl = STUDENT_CSV_URL;
    else if (sheetName === 'Hafalan') csvUrl = HAFALAN_CSV_URL;
    else if (sheetName === 'Principal') csvUrl = PRINCIPAL_CSV_URL;
    else if (sheetName === 'SPP') csvUrl = SPP_CSV_URL;

    // Untuk 'Score', kita SELALU gunakan Web App agar data realtime dan sinkron dengan input
    if (sheetName === 'Score') {
        return fetchFromWebApp<T>(sheetName);
    }

    // If a CSV URL is defined, try fetching it first
    if (csvUrl) {
        try {
            const response = await fetch(csvUrl);
            if (!response.ok) {
                throw new Error(`CSV fetch failed: ${response.statusText}`);
            }
            const csvText = await response.text();
            
            // Check if we got an HTML login page instead of CSV data (common CORS/Auth issue)
            if (csvText.trim().startsWith('<!DOCTYPE html>') || csvText.includes('<html')) {
                throw new Error('Received HTML instead of CSV (likely auth redirect)');
            }

            return parseCSV<T>(csvText);
        } catch (error) {
            console.warn(`Failed to fetch CSV for ${sheetName}, falling back to Web App. Error:`, error);
            // Fallback to Web App if CSV fails
            return fetchFromWebApp<T>(sheetName);
        }
    }

    return fetchFromWebApp<T>(sheetName);
};

export const addScore = async (scoreData: Omit<Score, 'Timestamp'>): Promise<{success: boolean, message: string}> => {
    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({
                action: 'addScore',
                data: scoreData
            }),
        });

        if (!response.ok) {
            throw new Error(`Server responded with an error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json(); 

        if (result.success) {
            return { success: true, message: result.message || 'Penilaian berhasil dikirim!' };
        } else {
            throw new Error(result.message || 'Terjadi kesalahan di server, namun server tidak memberikan detail.');
        }

    } catch (error) {
        console.error('Failed to add score:', error);
        throw error;
    }
};

export const deleteScore = async (timestamp: string): Promise<{success: boolean, message: string}> => {
    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'deleteScore',
                data: { timestamp }
            }),
        });

        const result = await response.json();
        if (result.success) return { success: true, message: result.message };
        else throw new Error(result.message);
    } catch (error) {
        throw error;
    }
};

export const editScore = async (originalTimestamp: string, newData: Omit<Score, 'Timestamp'>): Promise<{success: boolean, message: string}> => {
    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'editScore',
                data: { 
                    originalTimestamp,
                    newData
                }
            }),
        });

        const result = await response.json();
        if (result.success) return { success: true, message: result.message };
        else throw new Error(result.message);
    } catch (error) {
        throw error;
    }
};
