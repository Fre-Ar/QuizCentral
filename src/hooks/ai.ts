import { useState } from 'react';
import OpenAI from 'openai';
import { TemplateInstance } from '@/engine/types/schema';
import { json } from 'stream/consumers';

export function useOpenAPISending(apiKey: string | null){
    const [input, setInput] = useState('');
    const [reply, setReply] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const MCQ_MULT_INSTANCE = {
      type: "template_instance", 
      template_id: "tpl_mcq_mult",
    
      state: {
        required: false,
      },
    
      parameters: {
        question: "QUESTION TEXT HERE",
        options: [
          { label: "label1", value: 1, points: 0.5 },
          { label: "label2", value: 2, points: 0.5 },
          { label: "label3", value: 3, points: 0.0 },
          { label: "label4", value: 4, points: -1.0 },
        ],
        container_style: [], // no style, default
        question_text_style: ["text_style_id"],
        option_container_style: ["question_container"],
        option_style: ["green_bg", "white_text"],
    
        shuffle_options: true,
      },
    }
    const MCQ_SINGLE_INSTANCE = {
      template_id: "tpl_mcq_single",
    
      state: {
        required: false,
      },
    
      parameters: {
        question: "QUESTION TEXT HERE",
        options: [
          { label: "label1", value: 1, points: 1.0 },
          { label: "label2", value: 2, points: -1.0 },
          { label: "label3", value: 3, points: 0.0 },
          { label: "label4", value: 4, points: 0.5 },
        ],
        container_style: [], // no style, default
        question_text_style: ["text_style_id"],
        option_container_style: ["question_container"],
        option_style: ["green_bg", "white_text"],
    
        shuffle_options: true,
      },
    }
    const EXAMPLE1_INSTANCE = {
        template_id: "tpl_mcq_mult",

        state: {
            required: false,
        },

        parameters: {
            question: "Which of the following are colors? (Select all that apply)",
            options: [
            { label: "Red", value: 1, points: 0.5 },
            { label: "Blue", value: 2, points: 0.5 },
            { label: "Banana", value: 3, points: 0.0 },
            { label: "Dog", value: 4, points: -1.0 },
            ],
            container_style: [], // no style, default
            question_text_style: ["text_style_id"],
            option_container_style: ["question_container"],
            option_style: ["green_bg", "white_text"],

            shuffle_options: true,
        },
    }
     const EXAMPLE2_INSTANCE = {
        template_id: "tpl_mcq_mult",

        state: {
            required: false,
        },

        parameters: {
        question: "What is the capital of **France**?",
        options: [
            { label: "Paris", value: 1, points: 1.0 },
            { label: "Berlin", value: 2, points: -1.0 },
            { label: "Toulouse", value: 3, points: 0.0 },
            { label: "Versailles", value: 4, points: 0.5 },
        ],
            container_style: [], // no style, default
            question_text_style: ["text_style_id"],
            option_container_style: ["question_container"],
            option_style: ["green_bg", "white_text"],

            shuffle_options: true,
        },
    }
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
            { role: 'system', content: `You are a helpful Quiz-making assistant. Your task is focused on creating top quality multiple-choice question assessments.    Your task is focused on creating top quality multiple-choice question assessments. A multiple-choice question is a collection of three components (Stem, Correct Answers, Distractors), given a particular context of what the student is expected to know. The topic, as well as the context of the topic, will be provided in order to generate effective multiple-choice questions. The stem refers to the question the student will attempt to answer, as well as the relevant context necessary in order to answer the question. It may be in the form of a question, an incomplete statement, or a scenario. The stem should focus on assessing the specific knowledge or concept the question aims to evaluate. The Correct Answer(s) refers to the correct, undisputable answer(s) to the question in the stem. A Distractor is an incorrect answer to the question in the stem and adheres to the following properties. (1) A distractor should not be obviously wrong. In other words, it must still bear relations to the stem and correct answer. (2) A distractor should be phrased positively and be a true statement that does not correctly answer the stem, all while giving no clues towards the correct answer. (3) Although a distractor is incorrect, it must be plausible.(4) A distractor must be incorrect. It cannot be correct, or interpreted as correct by someone who strongly grasps the topic. Use “None of the Above” or “All of the Above” style answer choices sparingly. These answer choices have been shown to, in general, be less effective at measuring or assessing student understanding. Multiple-choice questions should be clear, concise, and grammatically correct statements. Make sure the questions are worded in a way that is easy to understand and does not introduce unnecessary complexity or ambiguity. Students should be able to understand the questions without confusion. The question should not be too long, and allow most students to finish in less than the given time. This means adhering to the following properties. (1) Avoid using overly long sentences. (2) If you refer to the same item or activity multiple times, use the same phrase each time. (3) Ensure that each multiple-choice question provides full context. In other words, if a phrase or action is not part of the provided topic or topic context that a student is expected to know, then be sure to explain it briefly or consider not including it. (4) Ensure that none of the distractors overlap. In other words, attempt to make each distractor reflect a different misconception on the topic, rather than a single one, if possible. (5) Avoid too many clues. Do not include too many clues or hints in the answer options, which may make it too obvious for students to determine the correct answer. These options should require students to use their knowledge and reasoning to make an informed choice. Output your multiple-choice quiz in an easy-to-parse json dictionary format ${JSON.stringify(MCQ_MULT_INSTANCE)} for quizes where multiple answers may be correct and ${JSON.stringify(MCQ_SINGLE_INSTANCE)} for quizes where only one answer is correct. Here are some examples of how to use format responses ${JSON.stringify(EXAMPLE1_INSTANCE)} and ${JSON.stringify(EXAMPLE2_INSTANCE)} ` },
            { role: 'user', content: input },
            ],
        });

        const text = completion.choices[0]?.message?.content ?? '';
        const responseJson = JSON.parse(text);
        const blocks =(responseJson as Array<TemplateInstance>)

        
        console.log('OpenAI response:', text);
        
        setReply(text);
        return blocks;
        } catch (err) {
        console.error(err);
        setReply('Error calling OpenAI. Check console and your API key.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.');
        } finally {
        setIsLoading(false);
        }
    };

    return { input, setInput, reply, isLoading, sendPrompt };

}