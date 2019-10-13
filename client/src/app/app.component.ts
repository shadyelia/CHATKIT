import { Component } from "@angular/core";
import Chatkit from "@pusher/chatkit-client";
import axios from "axios";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent {
  userId = "";
  currentUser = <any>{};
  messages = [];
  currentRoom = <any>{};
  roomUsers = [];
  userRooms = [];
  newMessage = "";

  connectToRoom(id) {
    this.messages = [];
    const { currentUser } = this;

    currentUser
      .subscribeToRoom({
        roomId: `${id}`,
        messageLimit: 100,
        hooks: {
          onMessage: message => {
            this.messages.push(message);
          },
          onPresenceChanged: () => {
            this.roomUsers = this.currentRoom.users.sort(a => {
              if (a.presence.state === "online") return -1;

              return 1;
            });
          }
        }
      })
      .then(currentRoom => {
        this.currentRoom = currentRoom;
        this.roomUsers = currentRoom.users;
        this.userRooms = currentUser.rooms;
      });
  }

  sendMessage() {
    const { newMessage, currentUser, currentRoom } = this;

    if (newMessage.trim() === "") return;

    currentUser.sendMessage({
      text: newMessage,
      roomId: `${currentRoom.id}`
    });

    this.newMessage = "";
  }

  addUser() {
    const { userId } = this;
    axios
      .post("http://localhost:5200/users", { userId })
      .then(() => {
        const tokenProvider = new Chatkit.TokenProvider({
          url: "http://localhost:5200/authenticate"
        });

        const chatManager = new Chatkit.ChatManager({
          instanceLocator: "v1:us1:cd98d4cf-e8dc-4541-a478-d80d7db00f64",
          userId,
          tokenProvider
        });

        return chatManager.connect().then(currentUser => {
          this.currentUser = currentUser;
          this.connectToRoom("064f2d6f-fa63-4bcd-b033-fc8e3ac81594");
        });
      })
      .catch(error => console.error(error));
  }
}
