import { Server } from 'socket.io';
import express from "express";
import * as http from "http";
import ViteExpress from "vite-express"

const app = express();
const server = http.createServer(app);


const io = new Server(server, { //모든 클라이언트가 접근 가능한 웹 소켓 서버
    cors: {
        origin: "*"
    }
});

// 금칙어 목록
const forbiddenWords = ['야', '응', '오키', '뭐', '팀장', '하이', '니', '뭔데', '나', '음', '인정', '정글', '나만무', '행복', '그만', '가보자', '베고파'];
//사용자별 금칙어 목록
var roomForbiddenWords = {};


io.on('connection', (client) => {               //client가 연결되면 실행
    console.log('사용자가 들어왔습니다!');

    const { username, roomnumber, role } = client.handshake.query;

    client.join(roomnumber); // 클라이언트를 해당 방에 입장

    if (role === 'host') {
        // 호스트에게만 특별한 초기 작업이 필요하면 여기서 수행 가능
        console.log(`${username} 님이 호스트로 설정되었습니다.`);
    } else {
        // 참가자 역할에 대한 처리
        console.log(`${username} 님이 참가자로 설정되었습니다.`);
    }

    console.log(`사용자 ${username} 가 ${roomnumber} 방에 참가`);

    // 방별 금칙어 선택 및 저장
    if (!roomForbiddenWords[roomnumber]) {
        roomForbiddenWords[roomnumber] = []; // 새로운 방 생성 시 초기화
    }

    // 랜덤으로 금칙어 선택
    const newForbiddenWord = forbiddenWords[Math.floor(Math.random() * forbiddenWords.length)];
    const userForbiddenWord = { username: username, forbiddenword: newForbiddenWord };
    roomForbiddenWords[roomnumber].push(userForbiddenWord);

    // 클라이언트에 금칙어 전송
    client.emit('forbidden word', newForbiddenWord);
    // 금칙어 리스트 전송
    io.to(roomnumber).emit('forbidden word list', roomForbiddenWords[roomnumber]);

    client.on('disconnect', () => {         //client로부터 disconnection
        console.log(`사용자가 나갔습니다... ${username}`);
        roomForbiddenWords[roomnumber] = roomForbiddenWords[roomnumber].filter(user => user.username !== username);
        io.to(roomnumber).emit('forbidden word list', roomForbiddenWords[roomnumber]);
    })
});

server.listen(3000, () => {
    console.log('서버에서 듣고 있습니다.. 3000');
});

ViteExpress.bind(app, server);