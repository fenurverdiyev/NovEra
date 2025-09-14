import type { Message, ToolCall } from '../types';
import { searchImagesAndVideos } from '../services/searchService';

type AddMessageFunc = (message: Omit<Message, 'id'>) => void;

interface ContactProperties {
    tel?: string[];
    email?: string[];
    name?: string[];
}

export const useDeviceTools = (addMessage: AddMessageFunc) => {
    
    const executeToolCalls = async (calls: ToolCall[]) => {
        for (const call of calls) {
            try {
                switch (call.name) {
                    case 'makeCall':
                        await executeMakeCall(call.args);
                        break;
                    case 'sendMessage':
                        await executeSendMessage(call.args);
                        break;
                    case 'setAlarm':
                        await executeSetAlarm(call.args);
                        break;
                    case 'addCalendarEvent':
                        await executeAddCalendarEvent(call.args);
                        break;
                    case 'addNote':
                        await executeAddNote(call.args);
                        break;
                    case 'toggleDevice':
                        await executeToggleDevice(call.args);
                        break;
                    case 'webSearch':
                        await executeWebSearch(call.args);
                        break;
                    default:
                        console.warn(`Unknown tool call: ${call.name}`);
                        addMessage({ role: 'model', text: `Naməlum alət "${call.name}" çağırıldı.` });
                }
            } catch (error: any) {
                // Handle specific errors thrown from tool execution, like unsupported features.
                if (error.message) {
                    addMessage({ role: 'model', text: error.message });
                } else {
                    console.error(`Error executing tool ${call.name}:`, error);
                }
            }
        }
    };

    const selectContact = async (contactName: string, requiredProperties: ('tel' | 'email')[]): Promise<ContactProperties | null> => {
        if (!('contacts' in navigator && 'select' in (navigator as any).contacts)) {
            // Throw a specific error to be caught by the caller function.
            const requiredInfo = requiredProperties.includes('tel') ? "telefon nömrəsini" : "e-poçt ünvanını";
            throw new Error(`Kontakt seçimi dəstəklənmir. Zəhmət olmasa, ${contactName} üçün ${requiredInfo} yazın.`);
        }

        try {
            addMessage({ role: 'model', text: `Kontaktlarınızdan "${contactName}" adlı şəxsi seçin...`});
            const contacts = await (navigator as any).contacts.select(requiredProperties, { multiple: false }) as ContactProperties[];
            if (contacts.length === 0) {
                addMessage({ role: 'model', text: "Kontakt seçilmədi." });
                return null;
            }
            return contacts[0];
        } catch (error) {
            console.error("Contact Picker API error:", error);
            addMessage({ role: 'model', text: "Kontaktları açmaq mümkün olmadı. Zəhmət olmasa, sayt üçün icazələri yoxlayın." });
            return null;
        }
    };


    const executeMakeCall = async (args: Record<string, any>) => {
        const { contactName } = args;
        if (!contactName) return;

        const contact = await selectContact(contactName, ['tel']);
        if (contact?.tel?.[0]) {
            const phoneNumber = contact.tel[0];
            addMessage({ role: 'model', text: `${contact.name?.[0] || contactName} adlı şəxsə zəng edilir...` });
            window.location.href = `tel:${phoneNumber}`;
        } else if (contact) { // Contact was selected but has no number
            addMessage({ role: 'model', text: `"${contact.name?.[0] || contactName}" üçün telefon nömrəsi tapılmadı.` });
        }
    };

    const executeSendMessage = async (args: Record<string, any>) => {
        const { contactName, message, service } = args;
        if (!contactName || !message || !service) return;

        const requiredProp = service === 'email' ? 'email' : 'tel';
        const contact = await selectContact(contactName, [requiredProp]);
        
        if (!contact) return;

        const displayName = contact.name?.[0] || contactName;

        switch (service.toLowerCase()) {
            case 'sms':
                if (contact.tel?.[0]) {
                    addMessage({ role: 'model', text: `SMS vasitəsilə ${displayName} adlı şəxsə mesaj göndərmək üçün proqram açılır...` });
                    const smsUri = `sms:${contact.tel[0]}?body=${encodeURIComponent(message)}`;
                    window.location.href = smsUri;
                } else {
                    addMessage({ role: 'model', text: `${displayName} üçün telefon nömrəsi tapılmadı.` });
                }
                break;

            case 'whatsapp':
                if (contact.tel?.[0]) {
                    // Note: WhatsApp requires the phone number in international format, without '+' or '00'.
                    // This basic implementation assumes the number is stored correctly.
                    const whatsappNumber = contact.tel[0].replace(/[^0-9]/g, '');
                    addMessage({ role: 'model', text: `WhatsApp vasitəsilə ${displayName} adlı şəxsə mesaj göndərmək üçün proqram açılır...` });
                    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                } else {
                     addMessage({ role: 'model', text: `${displayName} üçün telefon nömrəsi tapılmadı.` });
                }
                break;
            
            case 'email':
                if (contact.email?.[0]) {
                    addMessage({ role: 'model', text: `E-poçt vasitəsilə ${displayName} adlı şəxsə mesaj göndərmək üçün proqram açılır...` });
                    const mailtoUri = `mailto:${contact.email[0]}?body=${encodeURIComponent(message)}`;
                    window.location.href = mailtoUri;
                } else {
                     addMessage({ role: 'model', text: `${displayName} üçün e-poçt ünvanı tapılmadı.` });
                }
                break;
                
            default:
                 addMessage({ role: 'model', text: `Naməlum mesaj xidməti: ${service}` });
        }
    };
    
    const executeSetAlarm = async (args: Record<string, any>) => {
        const { time, label } = args;
        const confirmation = label 
            ? `✅ Tətbiqin yerli versiyasında '${label}' üçün saat ${time}-da siqnal qurulacaq.`
            : `✅ Tətbiqin yerli versiyasında saat ${time}-da siqnal qurulacaq.`;
        addMessage({ role: 'model', text: confirmation });
    };
    
    const executeAddCalendarEvent = async (args: Record<string, any>) => {
        const { title, description, startTime } = args;
        addMessage({ 
            role: 'model', 
            text: `✅ Tətbiqin yerli versiyasında təqvimə yeni tədbir əlavə olunacaq:\n**Başlıq:** ${title}\n**Vaxt:** ${startTime}${description ? `\n**Təsvir:** ${description}` : ''}`
        });
    };

    const executeAddNote = async (args: Record<string, any>) => {
        const { content } = args;
        addMessage({ 
            role: 'model', 
            text: `✅ Tətbiqin yerli versiyasında aşağıdakı qeyd əlavə olunacaq:\n\n> ${content}`
        });
    };
    
    const executeToggleDevice = async (args: Record<string, any>) => {
        const { device, state } = args;
        const deviceName = {
            'wifi': 'Wi-Fi',
            'bluetooth': 'Bluetooth',
            'flashlight': 'Fənər'
        }[device.toLowerCase()] || device;
        const stateName = state.toLowerCase() === 'on' ? 'yandırılır' : 'söndürülür';
        addMessage({ 
            role: 'model', 
            text: `✅ Tətbiqin yerli versiyasında ${deviceName} ${stateName}...`
        });
    };

    const executeWebSearch = async (args: Record<string, any>) => {
        const { query, maxImages = 6, maxVideos = 3 } = args || {};
        if (!query || typeof query !== 'string') {
            addMessage({ role: 'model', text: 'Axtarış üçün sual tapılmadı.' });
            return;
        }
        try {
            addMessage({ role: 'model', text: `🔎 Axtarıram: "${query}" ...` });
            const { images, videos } = await searchImagesAndVideos(query, maxImages, maxVideos);
            if ((images && images.length) || (videos && videos.length)) {
                addMessage({
                    role: 'model',
                    text: 'Tapdığım vizuallar aşağıdadır.',
                    images,
                    videos,
                });
            } else {
                addMessage({ role: 'model', text: 'Uyğun vizual tapılmadı.' });
            }
        } catch (e) {
            console.error('webSearch error:', e);
            addMessage({ role: 'model', text: 'Vizuallar üçün axtarış zamanı xəta baş verdi.' });
        }
    };

     
     return { executeToolCalls };
 };