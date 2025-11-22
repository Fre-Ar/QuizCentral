import { useState } from 'react';
import OpenAI from 'openai';

export function useOpenAPISending(apiKey: string | null){
    const [input, setInput] = useState('');
    const [reply, setReply] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    

    const sendPrompt = async () => {
        if (!apiKey) {
            alert('Please set your OpenAI API key first.');
            return;
        }

        setIsLoading(true);
        setReply('');

        try {
        const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

        const completion = await client.chat.completions.create({
            model: 'gpt-5-nano', 
            messages: [
            { role: 'system', content: 'You are a helpful Quiz-making assistant.' },
            { role: 'user', content: input },
            ],
        });

        const text = completion.choices[0]?.message?.content ?? '';
        setReply(text);
        } catch (err) {
        console.error(err);
        setReply('Error calling OpenAI. Check console and your API key.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.');
        } finally {
        setIsLoading(false);
        }
    };

    return { input, setInput, reply, isLoading, sendPrompt };

}