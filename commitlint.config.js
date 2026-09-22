export default {
    extends: ['@commitlint/config-conventional'],
    plugins: [
        {
            rules: {
                // 標準の subject-full-stop は文字を 1 つしか取れず、ASCII のピリオドと句点を同時に検査できない
                'subject-no-full-stop-ja': ({ subject }) => [
                    subject === null || !/[.。]$/.test(subject),
                    '件名の末尾に句点を付けない',
                ],
            },
        },
    ],
    rules: {
        // 件名は日本語で書き、Laravel などの固有名詞から始まることもあるため、大文字・小文字を問わない
        'subject-case': [0],
        // subject-no-full-stop-ja が句点も含めて検査するため、標準のルールは無効にする
        'subject-full-stop': [0],
        'subject-no-full-stop-ja': [2, 'always'],
    },
};
